use crate::constants::*;
use crate::events::*;
use crate::state::pool_state::PoolState;
use crate::utils::price::calculate_price;
use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Burn, Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct UnStake<'info> {
    #[account(
        seeds = [ POOL_STATE_SEED, token_mint.key().as_ref(), redeemable_mint.key().as_ref() ],
        bump,
    )]
    pub pool_state: Box<Account<'info, PoolState>>,

    #[account(
        constraint = token_mint.key() == pool_state.token_mint.key()
    )]
    pub token_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        constraint = redeemable_mint.key() == pool_state.redeemable_mint.key()
    )]
    pub redeemable_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        constraint = user_to.mint == pool_state.token_mint.key(),
    )]
    /// the token account to withdraw from
    pub user_to: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ TOKEN_VAULT_SEED, token_mint.key().as_ref(), redeemable_mint.key().as_ref() ],
        bump ,
    )]
    pub token_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = redeemable_from.mint == pool_state.redeemable_mint.key(),
    )]
    pub redeemable_from: Box<Account<'info, TokenAccount>>,

    /// the authority allowed to transfer from token_from
    pub redeemable_from_authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

impl<'info> UnStake<'info> {
    pub fn calculate_price(&self) -> u64 {
        calculate_price(&self.token_vault, &self.redeemable_mint, &self.pool_state)
    }

    pub fn into_burn_redeemable(&self) -> CpiContext<'_, '_, '_, 'info, Burn<'info>> {
        let cpi_accounts = Burn {
            mint: self.redeemable_mint.to_account_info(),
            to: self.redeemable_from.to_account_info(),
            authority: self.redeemable_from_authority.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }

    pub fn into_transfer_from_token_vault_to_user(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.token_vault.to_account_info(),
            to: self.user_to.to_account_info(),
            authority: self.token_vault.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

pub fn handle(ctx: Context<UnStake>, amount: u64) -> ProgramResult {
    let total_tokens = ctx.accounts.token_vault.amount;
    let total_redeemable_token_supply = ctx.accounts.redeemable_mint.supply;

    let old_price = ctx.accounts.calculate_price();
    msg!("old_price: {}", old_price);

    // burn redeemable tokens
    token::burn(ctx.accounts.into_burn_redeemable(), amount)?;

    // determine user share of vault
    // (amount * total_tokens) / total_redeemable_token_supply
    let token_share = (amount as u128)
        .checked_mul(total_tokens as u128)
        .unwrap()
        .checked_div(total_redeemable_token_supply as u128)
        .unwrap()
        .try_into()
        .unwrap();

    let token_mint_key = ctx.accounts.pool_state.token_mint.key();
    let redeemable_mint_key = ctx.accounts.pool_state.redeemable_mint.key();
    let seeds = &[
        TOKEN_VAULT_SEED,
        token_mint_key.as_ref(),
        redeemable_mint_key.as_ref(),
        &[ctx.accounts.pool_state.token_vault_bump],
    ];
    let signer = [&seeds[..]];

    // transfer from the vault to user
    let mut cpi_tx = ctx.accounts.into_transfer_from_token_vault_to_user();
    cpi_tx.signer_seeds = &signer;
    token::transfer(cpi_tx, token_share)?;

    (&mut ctx.accounts.token_vault).reload()?;
    (&mut ctx.accounts.redeemable_mint).reload()?;

    let new_price = ctx.accounts.calculate_price();
    msg!("new_price: {}", new_price);
    emit!(PriceChange {
        old_base_per_quote_native: old_price,
        new_base_per_quote_native: new_price,
    });

    Ok(())
}
