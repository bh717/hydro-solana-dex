use anchor_lang::prelude::*;

#[account]
#[derive(Debug, Default)]
pub struct PoolState {
    pub authority: Pubkey,
    pub token_vault: Pubkey,
    pub token_mint: Pubkey,
    pub token_mint_decimals: u8,
    pub redeemable_mint: Pubkey,
    pub pool_state_bump: u8,
    pub token_vault_bump: u8,
}
impl PoolState {}
