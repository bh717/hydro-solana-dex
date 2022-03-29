use crate::constants::*;
use crate::errors::ErrorCode;
use crate::state::curve_type::CurveType;
use crate::state::fees::Fees;
use crate::state::pool_state::*;
use crate::{pyth_account_security_check, DEBUG_MODE};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use std::mem;

#[derive(Accounts)]
#[instruction(token_a_vault_bump: u8, token_b_vault_bump: u8, pool_state_bump: u8, lp_token_vault_bump: u8, lp_token_mint_bump: u8)]
pub struct Initialize<'info> {
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        space = 8 + mem::size_of::<PoolState>(),
        payer = payer,
        seeds = [ POOL_STATE_SEED, lp_token_mint.key().as_ref() ],
        bump,
    )]
    pub pool_state: Box<Account<'info, PoolState>>,

    /// token_a_mint. Eg BTC
    pub token_x_mint: Box<Account<'info, Mint>>,

    // token_b_mint: Eg USDC
    #[account(
        constraint = token_x_mint.key().as_ref().lt(token_y_mint.key().as_ref()) @ ErrorCode::InvalidTokenOrder
    )]
    pub token_y_mint: Box<Account<'info, Mint>>,

    /// lp_token_mint: Eg xlp-hyd-usdc
    #[account(
        init,
        payer = payer,
        mint::decimals = 6,
        mint::authority = pool_state,
        seeds = [ LP_TOKEN_MINT_SEED, token_x_mint.key().as_ref(), token_y_mint.key().as_ref() ],
        bump,
    )]
    pub lp_token_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = payer,
        token::mint = token_x_mint,
        token::authority = pool_state,
        seeds = [ TOKEN_VAULT_SEED, token_x_mint.key().as_ref(), lp_token_mint.key().as_ref() ],
        bump,
    )]
    pub token_x_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        init,
        payer = payer,
        token::mint = token_y_mint,
        token::authority = pool_state,
        seeds = [ TOKEN_VAULT_SEED, token_y_mint.key().as_ref(), lp_token_mint.key().as_ref() ],
        bump,
    )]
    pub token_y_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        init,
        payer = payer,
        token::mint = lp_token_mint,
        token::authority = pool_state,
        seeds = [ LP_TOKEN_VAULT_SEED, pool_state.key().as_ref(), lp_token_mint.key().as_ref() ],
        bump,
    )]
    pub lp_token_vault: Box<Account<'info, TokenAccount>>,

    // system accounts
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle(
    ctx: Context<Initialize>,
    token_x_vault_bump: u8,
    token_y_vault_bump: u8,
    pool_state_bump: u8,
    lp_token_vault_bump: u8,
    lp_token_mint_bump: u8,
    compensation_parameter: u16,
    fees: Fees,
    curve_type: CurveType,
) -> Result<()> {
    let pool_state = &mut ctx.accounts.pool_state;

    // save authority
    pool_state.authority = ctx.accounts.authority.to_account_info().key();

    // save token_a_mint, token_b_mint and lp_token_mint
    pool_state.token_x_mint = ctx.accounts.token_x_mint.to_account_info().key();
    pool_state.token_y_mint = ctx.accounts.token_y_mint.to_account_info().key();
    pool_state.lp_token_mint = ctx.accounts.lp_token_mint.to_account_info().key();

    // save token_a_vault and token_b_vault Pubkeys
    pool_state.token_x_vault = ctx.accounts.token_x_vault.to_account_info().key();
    pool_state.token_y_vault = ctx.accounts.token_y_vault.to_account_info().key();

    // save pool_state_bump, token_a_vault_bump and token_a_vault_bump
    pool_state.pool_state_bump = pool_state_bump;
    pool_state.token_x_vault_bump = token_x_vault_bump;
    pool_state.token_y_vault_bump = token_y_vault_bump;
    pool_state.lp_token_vault_bump = lp_token_vault_bump;
    pool_state.lp_token_mint_bump = lp_token_mint_bump;
    pool_state.debug = DEBUG_MODE;

    // TODO: Review this and add some error handling once @correkt-horse refactors the math crate
    pool_state.compensation_parameter = compensation_parameter;

    // save fees
    fees.validate()?;
    pool_state.fees = fees;

    pool_state.curve_type = curve_type;

    // save pyth account settings once they validate.
    pool_state.pyth = pyth_account_security_check(&ctx.remaining_accounts)?;

    Ok(())
}
