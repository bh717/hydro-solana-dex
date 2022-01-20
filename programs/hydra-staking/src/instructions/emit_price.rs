use crate::constants::*;
use crate::events::*;
use crate::utils::price::calc_price;
use crate::ProgramResult;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};

#[derive(Accounts)]
pub struct EmitPrice<'info> {
    pub token_mint: Account<'info, Mint>,

    pub x_token_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [ token_mint.key().as_ref() ],
        bump,
    )]
    pub token_vault: Account<'info, TokenAccount>,
}

pub fn handle(ctx: Context<EmitPrice>) -> ProgramResult {
    let price = calc_price(&ctx.accounts.token_vault, &ctx.accounts.x_token_mint);
    emit!(Price {
        base_per_quote_native: price.0,
        base_per_quote_ui: price.1,
    });
    Ok(())
}
