use crate::constants::*;
use crate::events::*;
use crate::state::pool_state::PoolState;
use crate::utils::price::calculate_price;
use crate::ProgramResult;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};

#[derive(Accounts)]
pub struct EmitPrice<'info> {
    pub token_mint: Account<'info, Mint>,

    #[account(
        seeds = [ POOL_STATE_SEED, token_mint.key().as_ref(), redeemable_mint.key().as_ref() ],
        bump,
    )]
    pub pool_state: Account<'info, PoolState>,

    #[account(
        constraint = redeemable_mint.key() == pool_state.redeemable_mint.key()
    )]
    pub redeemable_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [ TOKEN_VAULT_SEED, token_mint.key().as_ref(), redeemable_mint.key().as_ref() ],
        bump,
    )]
    pub token_vault: Account<'info, TokenAccount>,
}

pub fn handle(ctx: Context<EmitPrice>) -> ProgramResult {
    let price = calculate_price(&ctx.accounts.token_vault, &ctx.accounts.redeemable_mint);
    emit!(Price {
        base_per_quote_native: price.0,
        base_per_quote_ui: price.1,
    });
    Ok(())
}
