use anchor_lang::prelude::*;

#[account]
#[derive(Debug, Default)]
pub struct PoolState {
    pub authority: Pubkey,
    pub vault_mint: Pubkey,
    pub redeemable_mint: Pubkey,
    pub state_bump_seed: u8,
    pub vault_bump_seed: u8,
}
impl PoolState {}
