use crate::constants::*;
use crate::events::*;
use crate::utils::price::calc_price;
use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
#[instruction(nonce: u8)]
pub struct Stake<'info> {
    pub token_mint: Box<Account<'info, Mint>>,

    pub x_token_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    /// the token account to withdraw from
    pub token_from: Box<Account<'info, TokenAccount>>,

    /// the authority allowed to transfer from token_from
    pub token_from_authority: Signer<'info>,

    #[account(
        mut,
        seeds = [ token_mint.key().as_ref() ],
        bump = nonce,
    )]
    pub token_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub x_token_to: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

pub fn handle(ctx: Context<Stake>, nonce: u8, amount: u64) -> ProgramResult {
    let total_token_vault = ctx.accounts.token_vault.amount;
    let total_x_token = ctx.accounts.x_token_mint.supply;
    let old_price = calc_price(&ctx.accounts.token_vault, &ctx.accounts.x_token_mint);

    let token_mint_key = ctx.accounts.token_mint.key();
    let seeds = &[token_mint_key.as_ref(), &[nonce]];
    let signer = [&seeds[..]];

    // On first stake.
    if total_token_vault == 0 || total_x_token == 0 {
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
    } else {
        // (amount * total_x_token.supply) / total_token_vault
        let mint_x_amount: u64 = amount
            .checked_mul(total_x_token)
            .unwrap()
            .checked_div(total_token_vault)
            .unwrap();

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.x_token_mint.to_account_info(),
                to: ctx.accounts.x_token_to.to_account_info(),
                authority: ctx.accounts.token_vault.to_account_info(),
            },
            &signer,
        );
        token::mint_to(cpi_ctx, mint_x_amount)?;
    }

    // transfer the users token's to the vault
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.token_from.to_account_info(),
            to: ctx.accounts.token_vault.to_account_info(),
            authority: ctx.accounts.token_from_authority.to_account_info(),
        },
    );
    token::transfer(cpi_ctx, amount)?;

    (&mut ctx.accounts.token_vault).reload()?;
    (&mut ctx.accounts.x_token_mint).reload()?;

    let new_price = calc_price(&ctx.accounts.token_vault, &ctx.accounts.x_token_mint);

    emit!(PriceChange {
        old_hyd_per_xhyd_1e9: old_price.0,
        old_hyd_per_xhyd: old_price.1,
        new_hyd_per_xhyd_1e9: new_price.0,
        new_hyd_per_xhyd: new_price.1,
    });

    Ok(())
}
