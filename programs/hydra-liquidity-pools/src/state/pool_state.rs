use anchor_lang::prelude::*;
use derivative::Derivative;
use std::io::Write;

#[account]
#[derive(Derivative)]
#[derivative(Debug, Default)]
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
    pub lp_token_vault_bump: u8,
    #[derivative(Default(value = "false"))]
    pub debug: bool,
    reserved: PoolStateReserve,
}
impl PoolState {}

const POOL_STATE_RESERVE_SIZE: usize = 511;

#[derive(Clone, Debug)]
pub struct PoolStateReserve([u8; POOL_STATE_RESERVE_SIZE]);

impl AnchorSerialize for PoolStateReserve {
    fn serialize<W: Write>(&self, writer: &mut W) -> std::io::Result<()> {
        writer.write_all(&self.0)
    }
}

impl AnchorDeserialize for PoolStateReserve {
    fn deserialize(_buf: &mut &[u8]) -> std::io::Result<Self> {
        Ok(Self([0u8; POOL_STATE_RESERVE_SIZE]))
    }
}

impl Default for PoolStateReserve {
    fn default() -> Self {
        PoolStateReserve {
            0: [0u8; POOL_STATE_RESERVE_SIZE],
        }
    }
}
