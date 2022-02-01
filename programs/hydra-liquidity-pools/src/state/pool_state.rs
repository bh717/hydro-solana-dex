use anchor_lang::prelude::*;
use derivative::Derivative;

#[account]
#[derive(Derivative)]
#[derivative(Debug, Default)]
pub struct PoolState {
    #[derivative(Default(value = "false"))]
    pub is_frozen: bool,
    pub authority: Pubkey,
    pub token_a_vault: Pubkey,
    pub token_b_vault: Pubkey,
    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub lp_token_mint: Pubkey,
    pub pool_state_bump: u8,
    pub token_a_vault_bump: u8,
    pub token_b_vault_bump: u8,
    pub x_total: u128,
    pub y_total: u128,
}
impl PoolState {}
