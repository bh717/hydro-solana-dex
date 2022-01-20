use crate::constants::*;
use crate::state::state::*;
use anchor_lang::{prelude::*, solana_program::system_program};
use anchor_spl::token::{Mint, Token, TokenAccount};
use std::mem::size_of;

#[derive(Accounts)]
#[instruction(vault_bump: u8, state_bump: u8)]
pub struct Initialize<'info> {
    pub authority: AccountInfo<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(init,
        payer = payer,
        seeds = [STATE_SEED],
        bump = state_bump,
        rent_exempt = enforce,
        space = 8 + size_of::<State>()
    )]
    pub state: Box<Account<'info, State>>,

    pub token_mint: Box<Account<'info, Mint>>,

    #[account(
        constraint = redeemable_mint.mint_authority.unwrap() == token_vault.key()
    )]
    pub redeemable_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = payer,
        token::mint = token_mint,
        token::authority = token_vault,
        seeds = [ token_mint.key().as_ref() ],
        bump = vault_bump,
    )]
    /// the not-yet-created, derived token vault pubkey. PDA
    pub token_vault: Box<Account<'info, TokenAccount>>,

    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle(ctx: Context<Initialize>, vault_bump: u8, state_bump: u8) -> ProgramResult {
    msg!("Initializing!");
    ctx.accounts.state.authority = *ctx.accounts.authority.to_account_info().key;
    ctx.accounts.state.token_mint = *ctx.accounts.token_mint.to_account_info().key;
    ctx.accounts.state.redeemable_mint = *ctx.accounts.redeemable_mint.to_account_info().key;
    ctx.accounts.state.state_bump_seed = state_bump;
    ctx.accounts.state.vault_bump_seed = vault_bump;
    Ok(())
}
