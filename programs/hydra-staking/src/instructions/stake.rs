use crate::constants::*;
use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
#[instruction(nonce: u8)]
pub struct Stake<'info> {
    #[account(
        address = HYDRA_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(
        mut,
        address = X_HYDRA_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
    )]
    pub x_token_mint: Account<'info, Mint>,

    #[account(mut)]
    /// the token acount to withdraw from
    pub token_from: Account<'info, TokenAccount>,

    /// the authority allowed to transfer from token_from
    pub token_from_authority: Signer<'info>,

    #[account(
        mut,
        seeds = [ token_mint.key().as_ref() ],
        bump = nonce,
    )]
    pub token_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub x_token_to: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[event]
pub struct StakeEvent {
    pub token_mint_pubkey: String,
    pub x_token_mint_pubkey: String,
    pub token_from_pubkey: String,
    pub token_from_authority_pubkey: String,
    pub token_vault_pubkey: String,
    pub x_token_to_pubkey: String,
}

#[event]
pub struct StakeDetails {
    pub x_token_mint_amount: u64,
}

pub fn handle(ctx: Context<Stake>, nonce: u8, amount: u64) -> ProgramResult {
    emit!(StakeEvent {
        token_mint_pubkey: ctx.accounts.token_mint.key().to_string(),
        x_token_mint_pubkey: ctx.accounts.x_token_mint.key().to_string(),
        token_from_pubkey: ctx.accounts.token_from.key().to_string(),
        token_from_authority_pubkey: ctx.accounts.token_from_authority.key().to_string(),
        token_vault_pubkey: ctx.accounts.token_vault.key().to_string(),
        x_token_to_pubkey: ctx.accounts.x_token_to.key().to_string(),
    });

    let total_token = ctx.accounts.token_vault.amount;
    let total_x_token = ctx.accounts.x_token_mint.supply;
    //
    let token_mint_key = ctx.accounts.token_mint.key();
    let seeds = &[token_mint_key.as_ref(), &[nonce]];
    let signer = [&seeds[..]];

    if total_token == 0 || total_x_token == 0 {
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.x_token_mint.to_account_info(),
                to: ctx.accounts.x_token_to.to_account_info(),
                authority: ctx.accounts.token_vault.to_account_info(),
            },
            &signer,
        );
        token::mint_to(cpi_ctx, amount)?;

        emit!(StakeDetails {
            x_token_mint_amount: amount
        })
    }

    Ok(())
}
