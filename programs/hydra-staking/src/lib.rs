mod instructions;
mod state;

use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

declare_id!("F1y1FTP91nwxbNUW3nXY6mKQzWawihwVYGwMsi7oKGyg");

#[cfg(feature = "localnet")]
pub mod constants {
    pub const HYDRA_TOKEN_MINT_PUBKEY: &str = "";
    pub const X_HYDRA_TOKEN_MINT_PUBKEY: &str = "";
}

#[cfg(feature = "devnet")]
pub mod constants {
    pub const HYDRA_TOKEN_MINT_PUBKEY: &str = "";
    pub const X_HYDRA_TOKEN_MINT_PUBKEY: &str = "";
}

#[program]
pub mod hydra_staking {
    use super::*;
    pub fn initialize(_ctx: Context<Initialize>) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(nonce: u8)]
pub struct Initialize<'info> {
    pub token_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = initializer,
        token::mint = token_mint,
        token::authority = token_vault,
        seeds = [ constants::HYDRA_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap().as_ref() ],
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
