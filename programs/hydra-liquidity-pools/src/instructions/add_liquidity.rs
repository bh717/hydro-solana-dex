use crate::ProgramResult;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct AddLiquidity {
    // #[account(
//     seeds = [ POOL_STATE_SEED, token_mint.key().as_ref(), redeemable_mint.key().as_ref() ],
//     bump,
// )]
// pub pool_state: Box<Account<'info, PoolState>>,
//
// #[account(
// constraint = token_mint.key() == pool_state.token_mint.key()
// )]
// pub token_mint: Box<Account<'info, Mint>>,
//
// #[account(
// mut,
// constraint = redeemable_mint.key() == pool_state.redeemable_mint.key()
// )]
// pub redeemable_mint: Box<Account<'info, Mint>>,
//
// #[account(
// mut,
// constraint = user_from.mint == pool_state.token_mint.key(),
// constraint = user_from.owner == user_from_authority.key()
// )]
// /// the token account to withdraw from
// pub user_from: Box<Account<'info, TokenAccount>>,
//
// /// the authority allowed to transfer from token_from
// pub user_from_authority: Signer<'info>,
//
// #[account(
// mut,
// seeds = [ TOKEN_VAULT_SEED, token_mint.key().as_ref(), redeemable_mint.key().as_ref() ],
// bump,
// constraint = token_vault.key() == pool_state.token_vault.key()
// )]
// pub token_vault: Box<Account<'info, TokenAccount>>,
//
// #[account(
// mut,
// constraint = redeemable_to.mint == pool_state.redeemable_mint.key(),
// )]
// pub redeemable_to: Box<Account<'info, TokenAccount>>,
//
// pub token_program: Program<'info, Token>,
}

pub fn handle(ctx: Context<AddLiquidity>) -> ProgramResult {
    Ok(())
}
