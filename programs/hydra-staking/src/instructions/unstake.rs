use crate::constants::*;
use crate::events::*;
use crate::state::state::State;
use crate::utils::price::calc_price;
use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
#[instruction(vault_bump: u8, state_bump: u8)]
pub struct UnStake<'info> {
    #[account(
        seeds = [STATE_SEED],
        bump = state_bump,
    )]
    pub state: Box<Account<'info, State>>,

    #[account(
        constraint = token_mint.key() == state.token_mint.key()
    )]
    pub token_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        constraint = redeemable_mint.key() == state.redeemable_mint.key()
    )]
    pub redeemable_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        constraint = user_to.mint == state.token_mint.key(),
    )]
    /// the token account to withdraw from
    pub user_to: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ state.token_mint.key().as_ref() ],
        bump = vault_bump,
    )]
    pub token_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = redeemable_from.mint == state.redeemable_mint.key(),
    )]
    pub redeemable_from: Box<Account<'info, TokenAccount>>,

    /// the authority allowed to transfer from token_from
    pub redeemable_from_authority: Signer<'info>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,
}

pub fn handle(ctx: Context<UnStake>, vault_bump: u8, state_bump: u8, amount: u64) -> ProgramResult {
    let total_tokens = ctx.accounts.token_vault.amount;
    let total_redeemable_token_supply = ctx.accounts.redeemable_mint.supply;
    let old_price = calc_price(&ctx.accounts.token_vault, &ctx.accounts.redeemable_mint);

    // burn incoming tokens
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token::Burn {
            mint: ctx.accounts.redeemable_mint.to_account_info(),
            to: ctx.accounts.redeemable_from.to_account_info(),
            authority: ctx.accounts.redeemable_from_authority.to_account_info(),
        },
    );
    token::burn(cpi_ctx, amount)?;

    // determine user share of vault
    // (amount * total_tokens) / total_redeemable_token_supply
    let token_share = amount
        .checked_mul(total_tokens)
        .unwrap()
        .checked_div(total_redeemable_token_supply)
        .unwrap();

    let token_mint_key = ctx.accounts.state.token_mint.key();
    let seeds = &[token_mint_key.as_ref(), &[vault_bump]];
    let signer = &[&seeds[..]];

    // transfer from the vault to user
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.token_vault.to_account_info(),
            to: ctx.accounts.user_to.to_account_info(),
            authority: ctx.accounts.token_vault.to_account_info(),
        },
        signer,
    );
    token::transfer(cpi_ctx, token_share)?;

    (&mut ctx.accounts.token_vault).reload()?;
    (&mut ctx.accounts.redeemable_mint).reload()?;

    let new_price = calc_price(&ctx.accounts.token_vault, &ctx.accounts.redeemable_mint);

    emit!(PriceChange {
        old_base_per_quote_native: old_price.0,
        old_base_per_quote_ui: old_price.1,
        new_base_per_quote_native: new_price.0,
        new_base_per_quote_ui: new_price.1,
    });

    Ok(())
}
