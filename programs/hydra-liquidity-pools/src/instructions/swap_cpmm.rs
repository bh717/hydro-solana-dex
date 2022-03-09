use crate::constants::*;
use crate::errors::ErrorCode;
use crate::state::pool_state::PoolState;
use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Token, TokenAccount, Transfer};
use hydra_math::swap_calculator::SwapCalculator;

#[derive(Accounts)]
pub struct SwapCpmm<'info> {
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [ POOL_STATE_SEED, pool_state.lp_token_mint.as_ref() ],
        bump = pool_state.pool_state_bump,
    )]
    pub pool_state: Box<Account<'info, PoolState>>,

    #[account(
        mut,
        constraint = user_from_token.mint == pool_state.base_token_mint,
        constraint = user_from_token.owner == user.key()
    )]
    /// the token account to withdraw from
    pub user_from_token: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = user_to_token.mint == pool_state.quote_token_mint,
        constraint = user_to_token.owner == user.key()
    )]
    /// the token account to withdraw from
    pub user_to_token: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ TOKEN_VAULT_SEED, pool_state.base_token_mint.as_ref(), pool_state.lp_token_mint.as_ref() ],
        bump = pool_state.base_token_vault_bump,
        constraint = base_token_vault.key() == pool_state.base_token_vault,
    )]
    pub base_token_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ TOKEN_VAULT_SEED, pool_state.quote_token_mint.as_ref(), pool_state.lp_token_mint.as_ref() ],
        bump = pool_state.quote_token_vault_bump,
        constraint = quote_token_vault.key() == pool_state.quote_token_vault,
    )]
    pub quote_token_vault: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

impl<'info> SwapCpmm<'info> {
    pub(crate) fn transfer_tokens_to_user(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.quote_token_vault.to_account_info(),
            to: self.user_to_token.to_account_info(),
            authority: self.pool_state.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

impl<'info> SwapCpmm<'info> {
    pub fn transfer_user_tokens_to_vault(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.user_from_token.to_account_info(),
            to: self.base_token_vault.to_account_info(),
            authority: self.user.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

pub fn handle(ctx: Context<SwapCpmm>, amount_in: u64, minimum_amount_out: u64) -> Result<()> {
    let swap = SwapCalculator::new(
        ctx.accounts.base_token_vault.amount as u128,
        ctx.accounts.quote_token_vault.amount as u128,
        ctx.accounts.pool_state.compensation_parameter as u128,
        10000, // TODO: build in Oracle. However this didnt make any diff in my testing?
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

    // TODO: Better handling of c value.
    // TODO: Price Oracle
    // TODO: Pool fee
    // TODO: liquidity mining fee

    Ok(())
}
