use crate::constants::*;
use crate::errors::ErrorCode;
use crate::state::pool_state::PoolState;
use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Mint, Token, TokenAccount, Transfer};
use hydra_math::swap_calculator::SwapCalculator;
use hydra_math::swap_result::SwapResult;
use hydra_math_rs::programs::liquidity_pools::fees::calculate_fee;

#[derive(Accounts)]
pub struct Swap<'info> {
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [ POOL_STATE_SEED, pool_state.lp_token_mint.as_ref() ],
        bump = pool_state.pool_state_bump,
    )]
    pub pool_state: Box<Account<'info, PoolState>>,
    #[account(
        mut,
        constraint = lp_token_mint.key() == pool_state.lp_token_mint,
    )]
    pub lp_token_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        constraint = user_from_token.owner == user.key()
    )]
    /// the token account to withdraw from
    pub user_from_token: Box<Account<'info, TokenAccount>>,

    // TODO: setup init_if_needed
    #[account(
        mut,
        constraint = user_to_token.owner == user.key()
    )]
    /// token account to send too.  
    pub user_to_token: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ TOKEN_VAULT_SEED, pool_state.token_x_mint.as_ref(), pool_state.lp_token_mint.as_ref() ],
        bump = pool_state.token_x_vault_bump,
        constraint = token_x_vault.key() == pool_state.token_x_vault,
    )]
    pub token_x_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ TOKEN_VAULT_SEED, pool_state.token_y_mint.as_ref(), pool_state.lp_token_mint.as_ref() ],
        bump = pool_state.token_y_vault_bump,
        constraint = token_y_vault.key() == pool_state.token_y_vault,
    )]
    pub token_y_vault: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

impl<'info> Swap<'info> {
    pub fn deduct_swap_fee(&self, transfer_out_amount: u64) -> u64 {
        if let Some(fee) = calculate_fee(
            transfer_out_amount as u128,
            self.pool_state.fees.trade_fee_numerator as u128,
            self.pool_state.fees.trade_fee_denominator as u128,
        ) {
            msg!("fee: {:?}", fee as u64);
            return transfer_out_amount.checked_sub(fee as u64).unwrap();
        }

        // no fee
        transfer_out_amount
    }

    pub fn transfer_tokens_to_user(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.token_y_vault.to_account_info(),
            to: self.user_to_token.to_account_info(),
            authority: self.pool_state.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }

    pub fn transfer_user_tokens_to_vault(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.user_from_token.to_account_info(),
            to: self.token_x_vault.to_account_info(),
            authority: self.user.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

// security check mint addresses are both correct as per the pool state object.
pub fn check_mint_addresses(ctx: &Context<Swap>) -> Result<()> {
    let mut user_to_token_valid = false;
    let mut user_from_token_valid = false;

    if ctx.accounts.user_to_token.mint == ctx.accounts.pool_state.token_x_mint {
        user_to_token_valid = true;
    }

    if ctx.accounts.user_to_token.mint == ctx.accounts.pool_state.token_y_mint {
        user_to_token_valid = true;
    }

    if ctx.accounts.user_from_token.mint == ctx.accounts.pool_state.token_x_mint {
        user_from_token_valid = true;
    }

    if ctx.accounts.user_from_token.mint == ctx.accounts.pool_state.token_y_mint {
        user_from_token_valid = true;
    }

    // if both mint's arent valid return an error.
    if !(user_to_token_valid && user_from_token_valid) {
        return Err(ErrorCode::InvalidMintAddress.into());
    }

    Ok(())
}

pub fn handle(ctx: Context<Swap>, amount_in: u64, minimum_amount_out: u64) -> Result<()> {
    // Setup SwapCalculate.
    let swap = SwapCalculator::new(
        ctx.accounts.token_x_vault.amount as u128,
        ctx.accounts.token_y_vault.amount as u128,
        ctx.accounts.pool_state.compensation_parameter as u128,
        0,
    );

    let mut result = SwapResult::init();
    let mut transfer_in_amount = 0;
    let mut transfer_out_amount = 0;

    // detect swap direction. x to y
    if ctx.accounts.user_from_token.mint == ctx.accounts.pool_state.token_x_mint {
        // confirm the other side matches pool state of y
        if ctx.accounts.user_to_token.mint != ctx.accounts.pool_state.token_y_mint {
            return Err(ErrorCode::InvalidMintAddress.into());
        }

        result = swap.swap_x_to_y_amm(amount_in as u128);

        transfer_in_amount = result.delta_x().unwrap();
        transfer_out_amount = result.delta_y().unwrap();
    }

    // detect swap direction y to x
    if ctx.accounts.user_from_token.mint == ctx.accounts.pool_state.token_y_mint {
        // confirm the other side matches the pool state of x
        if ctx.accounts.user_to_token.mint != ctx.accounts.pool_state.token_x_mint {
            return Err(ErrorCode::InvalidMintAddress.into());
        }

        result = swap.swap_y_to_x_amm(amount_in as u128);

        transfer_in_amount = result.delta_y().unwrap();
        transfer_out_amount = result.delta_x().unwrap();
    }

    // deduct fee
    transfer_out_amount = ctx.accounts.deduct_swap_fee(transfer_out_amount);

    // check slippage for amount_out
    if transfer_out_amount < minimum_amount_out {
        msg!("SlippageExceeded!");
        msg!("transfer_out_amount: {:?}", transfer_out_amount);
        msg!("minimum_amount_out: {:?}", minimum_amount_out);
        return Err(ErrorCode::SlippageExceeded.into());
    }

    // check slippage for amount_in
    if transfer_in_amount > amount_in {
        msg!("SlippageExceeded!");
        msg!("transfer_in_amount: {:?}", transfer_in_amount);
        msg!("amount_in: {:?}", amount_in);
        return Err(ErrorCode::SlippageExceeded.into());
    }

    // transfer base token into vault
    token::transfer(
        ctx.accounts.transfer_user_tokens_to_vault(),
        transfer_in_amount,
    )?;

    // signer
    let seeds = &[
        POOL_STATE_SEED,
        ctx.accounts.pool_state.lp_token_mint.as_ref(),
        &[ctx.accounts.pool_state.pool_state_bump],
    ];
    let signer = [&seeds[..]];

    // transfer quote token to user
    token::transfer(
        ctx.accounts.transfer_tokens_to_user().with_signer(&signer),
        transfer_out_amount,
    )?;

    Ok(())
}
