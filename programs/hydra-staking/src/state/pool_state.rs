use anchor_lang::prelude::*;

#[account]
#[derive(Debug, Default)]
pub struct PoolState {
    pub token_vault: Pubkey,
    pub token_mint: Pubkey,
    pub redeemable_mint: Pubkey,
    pub pool_state_bump: u8,
    pub token_vault_bump: u8,
    pub pool_price_native: u64,
}
impl PoolState {}
