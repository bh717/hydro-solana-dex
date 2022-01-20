mod events;
mod instructions;
mod state;
mod utils;

use anchor_lang::prelude::*;
use instructions::emit_price::*;
use instructions::initialize::*;
use instructions::stake::*;
use instructions::unstake::*;

declare_id!("F1y1FTP91nwxbNUW3nXY6mKQzWawihwVYGwMsi7oKGyg");

pub mod constants {
    pub const STATE_SEED: &[u8] = b"state_seed";
}

#[program]
pub mod hydra_staking {
    use super::*;

    /// initialize token_vault
    pub fn initialize(ctx: Context<Initialize>, vault_bump: u8, state_bump: u8) -> ProgramResult {
        instructions::initialize::handle(ctx, vault_bump, state_bump)
    }

    pub fn stake(
        ctx: Context<Stake>,
        vault_bump: u8,
        state_bump: u8,
        amount: u64,
    ) -> ProgramResult {
        instructions::stake::handle(ctx, vault_bump, state_bump, amount)
    }

    pub fn emit_price(ctx: Context<EmitPrice>, state_bump: u8) -> ProgramResult {
        instructions::emit_price::handle(ctx, state_bump)
    }

    pub fn unstake(
        ctx: Context<UnStake>,
        vault_bump: u8,
        state_bump: u8,
        amount: u64,
    ) -> ProgramResult {
        instructions::unstake::handle(ctx, vault_bump, state_bump, amount)
    }
}
