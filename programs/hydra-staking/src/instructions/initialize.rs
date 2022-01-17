use crate::constants::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
#[instruction(nonce: u8)]
pub struct Initialize<'info> {
    #[account(
        address = HYDRA_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
    )]
    pub token_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = initializer,
        token::mint = token_mint,
        token::authority = token_vault,
        seeds = [ HYDRA_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap().as_ref() ],
        bump = nonce,
    )]
    /// the not-yet-created, derived token vault pubkey. PDA
    pub token_vault: Box<Account<'info, TokenAccount>>,

    // #[account(mut)] TODO Review if needed.
    pub initializer: Signer<'info>,

    /// required by anchor for init of the token_vault
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle(ctx: Context<Initialize>, nonce: u8) -> ProgramResult {
    msg!("Initialize!");
    Ok(())
}
