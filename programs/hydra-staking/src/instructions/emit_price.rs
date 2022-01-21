use crate::constants::*;
use crate::events::*;
use crate::state::state::State;
use crate::utils::price::calculate_price;
use crate::ProgramResult;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};

#[derive(Accounts)]
#[instruction(state_bump: u8)]
pub struct EmitPrice<'info> {
    pub token_mint: Account<'info, Mint>,

    #[account(
        seeds = [STATE_SEED],
        bump = state_bump,
    )]
    pub state: Account<'info, State>,

    #[account(
        constraint = redeemable_mint.key() == state.redeemable_mint.key()
    )]
    pub redeemable_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [ token_mint.key().as_ref() ],
        bump,
    )]
    pub token_vault: Account<'info, TokenAccount>,
}

pub fn handle(ctx: Context<EmitPrice>, state_bump: u8) -> ProgramResult {
    let price = calculate_price(&ctx.accounts.token_vault, &ctx.accounts.redeemable_mint);
    emit!(Price {
        base_per_quote_native: price.0,
        base_per_quote_ui: price.1,
    });
    Ok(())
}
