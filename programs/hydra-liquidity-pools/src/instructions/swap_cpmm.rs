use crate::constants::*;
use crate::state::pool_state::PoolState;
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use hydra_math::swap_calculator::SwapCalculator;
use hydra_math::swap_result::SwapResult;

#[derive(Accounts)]
pub struct SwapCpmm<'info> {
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [ POOL_STATE_SEED, pool_state.lp_token_mint.key().as_ref() ],
        bump = pool_state.pool_state_bump,
    )]
    pub pool_state: Box<Account<'info, PoolState>>,

    #[account(
        mut,
        constraint = user_from_token.mint == pool_state.base_token_mint.key(),
        constraint = user_from_token.owner == user.key()
    )]
    /// the token account to withdraw from
    pub user_from_token: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = user_to_token.mint == pool_state.quote_token_mint.key(),
        constraint = user_to_token.owner == user.key()
    )]
    /// the token account to withdraw from
    pub user_to_token: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ TOKEN_VAULT_SEED, pool_state.base_token_mint.key().as_ref(), pool_state.lp_token_mint.key().as_ref() ],
        bump = pool_state.base_token_vault_bump,
        constraint = base_token_vault.key() == pool_state.base_token_vault.key()
    )]
    pub base_token_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ TOKEN_VAULT_SEED, pool_state.quote_token_mint.key().as_ref(), pool_state.lp_token_mint.key().as_ref() ],
        bump = pool_state.quote_token_vault_bump,
        constraint = quote_token_vault.key() == pool_state.quote_token_vault.key()
    )]
    pub quote_token_vault: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

pub fn handle(ctx: Context<SwapCpmm>, amount_in: u64, _minimum_amount_out: u64) -> ProgramResult {
    let swap = SwapCalculator::new(
        ctx.accounts.base_token_vault.amount as u128,
        ctx.accounts.quote_token_vault.amount as u128,
        0,
        1,
    );

    msg!("Swap: {:#?}", swap);

    let x = swap.swap_x_to_y_amm(amount_in as u128);

    msg!("SwapResult: {:#?}", x);

    panic!("crash oops");

    Ok(())
}
