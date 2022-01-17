mod events;
mod instructions;
mod state;
mod utils;

use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use instructions::emit_price::*;
use instructions::initialize::*;
use instructions::stake::*;

declare_id!("F1y1FTP91nwxbNUW3nXY6mKQzWawihwVYGwMsi7oKGyg");

#[cfg(feature = "localnet")]
pub mod constants {
    pub const HYDRA_TOKEN_MINT_PUBKEY: &str = "hyd3VthE9YPGBeg9HEgZsrM5qPniC6VoaEFeTGkVsJR";
    pub const X_HYDRA_TOKEN_MINT_PUBKEY: &str = "xhy1rv75cEJahTbsKnv2TpNhdR7KNUoDPavKuQDwhDU";
}

#[cfg(feature = "devnet")]
pub mod constants {
    pub const HYDRA_TOKEN_MINT_PUBKEY: &str = "hys1r9KVpTjyKi5pG6aj33y5zagE9Rws2k9jmpvn2ja";
    pub const X_HYDRA_TOKEN_MINT_PUBKEY: &str = "";
}

#[program]
pub mod hydra_staking {

    use super::*;

    /// initialize token_vault
    pub fn initialize(ctx: Context<Initialize>, nonce: u8) -> ProgramResult {
        instructions::initialize::handle(ctx, nonce)
    }

    pub fn stake(ctx: Context<Stake>, nonce: u8, amount: u64) -> ProgramResult {
        instructions::stake::handle(ctx, nonce, amount)
    }

    pub fn emit_price(ctx: Context<EmitPrice>) -> ProgramResult {
        instructions::emit_price::handle(ctx)
    }
}
