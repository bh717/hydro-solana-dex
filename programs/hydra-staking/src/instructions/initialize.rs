use crate::constants::*;
use crate::state::pool_state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use std::mem;

#[derive(Accounts)]
#[instruction(token_vault_bump: u8, pool_state_bump: u8)]
pub struct Initialize<'info> {
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        space = 8 + mem::size_of::<PoolState>(),
        payer = payer,
        seeds = [ POOL_STATE_SEED, token_mint.key().as_ref(), redeemable_mint.key().as_ref() ],
        bump,
        rent_exempt = enforce,
    )]
    pub pool_state: Box<Account<'info, PoolState>>,

    /// token_mint. Eg HYD
    pub token_mint: Box<Account<'info, Mint>>,

    #[account(
        constraint = redeemable_mint.mint_authority.unwrap() == token_vault.key()
    )]
    /// redeemable_mint: Eg xHYD
    pub redeemable_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = payer,
        token::mint = token_mint,
        token::authority = token_vault,
        seeds = [ TOKEN_VAULT_SEED, token_mint.key().as_ref(), redeemable_mint.key().as_ref() ],
        bump,
    )]
    pub token_vault: Box<Account<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle(ctx: Context<Initialize>, token_vault_bump: u8, pool_state_bump: u8) -> Result<()> {
    ctx.accounts.pool_state.authority = *ctx.accounts.authority.to_account_info().key;
    ctx.accounts.pool_state.token_mint = *ctx.accounts.token_mint.to_account_info().key;
    ctx.accounts.pool_state.redeemable_mint = *ctx.accounts.redeemable_mint.to_account_info().key;
    ctx.accounts.pool_state.pool_state_bump = pool_state_bump;
    ctx.accounts.pool_state.token_vault_bump = token_vault_bump;
    ctx.accounts.pool_state.token_vault = ctx.accounts.token_vault.to_account_info().key();
    ctx.accounts.pool_state.token_mint_decimals = ctx.accounts.token_mint.decimals;
    Ok(())
}
