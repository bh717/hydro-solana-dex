use crate::constants::*;
use crate::events::*;
use crate::utils::price::calc_price;
use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
#[instruction(nonce: u8)]
pub struct UnStake<'info> {
    #[account(
        address = HYDRA_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
    )]
    pub token_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        address = X_HYDRA_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
    )]
    pub x_token_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    // the token account to withdraw from
    pub x_token_from: Box<Account<'info, TokenAccount>>,

    pub x_token_from_authority: Signer<'info>,

    #[account(
        mut,
        seeds = [ token_mint.key().as_ref() ],
        bump = nonce,
    )]
    pub token_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub token_to: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

pub fn handle(ctx: Context<UnStake>, nonce: u8, amount: u64) -> ProgramResult {
    // let total_token = ctx.accounts.token_vault.amount;
    // let total_x_token = ctx.accounts.x_token_mint.supply;
    // let old_price = calc_price(&ctx.accounts.token_vault, &ctx.accounts.x_token_mint);

    //burn incoming tokens
    // let cpi_ctx = CpiContext::new(
    //     ctx.accounts.token_program.to_account_info(),
    //     token::Burn {
    //         mint: ctx.accounts.x_token_mint.to_account_info(),
    //         to: ctx.accounts.x_token_from.to_account_info(),
    //         authority: ctx.accounts.x_token_from_authority.to_account_info(),
    //     },
    // );
    // token::burn(cpi_ctx, amount)?;
    //
    // // determine user share of vault
    // // (amount * total_token) / token_x_token
    // let token_share = amount
    //     .checked_mul(total_token)
    //     .unwrap()
    //     .checked_div(total_x_token)
    //     .unwrap();
    //
    // let token_mint_key = ctx.accounts.token_mint.key();
    // let seeds = &[token_mint_key.as_ref(), &[nonce]];
    // let signer = &[&seeds[..]];
    //
    // // transfer from the vault to user
    // let cpi_ctx = CpiContext::new_with_signer(
    //     ctx.accounts.token_program.to_account_info(),
    //     token::Transfer {
    //         from: ctx.accounts.token_vault.to_account_info(),
    //         to: ctx.accounts.token_to.to_account_info(),
    //         authority: ctx.accounts.token_vault.to_account_info(),
    //     },
    //     signer,
    // );
    // token::transfer(cpi_ctx, token_share);
    //
    // (&mut ctx.accounts.token_vault).reload()?;
    // (&mut ctx.accounts.x_token_mint).reload()?;
    //
    // let new_price = calc_price(&ctx.accounts.token_vault, &ctx.accounts.x_token_mint);
    //
    // emit!(PriceChange {
    //     old_hyd_per_xhyd_1e9: old_price.0,
    //     old_hyd_per_xhyd: old_price.1,
    //     new_hyd_per_xhyd_1e9: new_price.0,
    //     new_hyd_per_xhyd: new_price.1,
    // });
    //
    Ok(())
}
