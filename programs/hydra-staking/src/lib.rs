mod events;
mod instructions;
mod state;
mod utils;

use anchor_lang::prelude::*;
use instructions::initialize::*;
use instructions::stake::*;
use instructions::unstake::*;

declare_id!("F1y1FTP91nwxbNUW3nXY6mKQzWawihwVYGwMsi7oKGyg");

pub mod constants {
    pub const TOKEN_VAULT_SEED: &[u8] = b"token_vault_seed";
    pub const POOL_STATE_SEED: &[u8] = b"pool_state_seed";
}

#[program]
pub mod hydra_staking {
    use super::*;

    /// initialize token_vault
    pub fn initialize(
        ctx: Context<Initialize>,
        token_vault_bump: u8,
        pool_state_bump: u8,
    ) -> Result<()> {
        instructions::initialize::handle(ctx, token_vault_bump, pool_state_bump)
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        instructions::stake::handle(ctx, amount)
    }

    pub fn unstake(ctx: Context<UnStake>, amount: u64) -> Result<()> {
        instructions::unstake::handle(ctx, amount)
    }
}
