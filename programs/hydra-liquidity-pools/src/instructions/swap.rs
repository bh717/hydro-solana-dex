use crate::constants::*;
use crate::errors::ErrorCode;
use crate::state::pool_state::PoolState;
use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Mint, Token, TokenAccount, Transfer};
use hydra_math::swap_calculator::SwapCalculator;

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

    #[account(
        mut,
        constraint = user_to_token.owner == user.key()
    )]
    /// the token account to withdraw from
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

impl<'info> Swap <'info> {
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

pub fn handle(ctx: Context<Swap>, amount_in: u64, minimum_amount_out: u64) -> Result<()> {
    // TODO: detect side.

    // TODO: detect hmm or cpmm

    // Calculate swap.
    let swap = SwapCalculator::new(
        ctx.accounts.token_x_vault.amount as u128,
        ctx.accounts.token_y_vault.amount as u128,
        ctx.accounts.pool_state.compensation_parameter as u128,
        0,
    );

    let result = swap.swap_x_to_y_amm(amount_in as u128);

    // check slippage for amount_out
    if result.delta_y().unwrap() < minimum_amount_out {
        return Err(ErrorCode::SlippageExceeded.into());
    }

    // check slippage for amount_in
    if result.delta_x().unwrap() > amount_in {
        return Err(ErrorCode::SlippageExceeded.into());
    }

    // transfer base token into vault
    token::transfer(
        ctx.accounts.transfer_user_tokens_to_vault(),
        result.delta_x().unwrap(),
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
        result.delta_y().unwrap(),
    )?;

    (&mut ctx.accounts.token_x_vault).reload()?;
    (&mut ctx.accounts.token_y_vault).reload()?;

    if result.x_new().unwrap() != ctx.accounts.token_x_vault.amount {
        return Err(ErrorCode::InvalidVaultToSwapResultAmounts.into());
    }

    if result.y_new().unwrap() != ctx.accounts.token_y_vault.amount {
        return Err(ErrorCode::InvalidVaultToSwapResultAmounts.into());
    }

    // TODO: This is broken as we are getting a different k value from the SwapCalculator
    // if result.k().unwrap() != ctx.accounts.lp_token_mint.supply {
    //     return Err(ErrorCode::InvalidVaultToSwapResultAmounts.into());
    // }

    // TODO: Better handling of c value.
    // TODO: Price Oracle
    // TODO: Pool fee
    // TODO: liquidity mining fee

    Ok(())
}
