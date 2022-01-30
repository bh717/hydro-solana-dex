use anchor_lang::prelude::*;

#[account]
#[derive(Debug, Default)]
pub struct PoolState {
    pub authority: Pubkey,
    pub token_a_vault: Pubkey,
    pub token_b_vault: Pubkey,
    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub lp_token_mint: Pubkey,
    pub pool_state_bump: u8,
    pub token_a_vault_bump: u8,
    pub token_b_vault_bump: u8,
    pub x_total: u64,
    pub y_total: u64,
}
impl PoolState {}
