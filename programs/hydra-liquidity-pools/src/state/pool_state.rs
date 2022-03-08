use anchor_lang::prelude::*;
use derivative::Derivative;
use std::io::Write;

#[account]
#[derive(Default, Derivative)]
pub struct PoolState {
    pub authority: Pubkey,
    pub base_token_vault: Pubkey,
    pub quote_token_vault: Pubkey,
    pub base_token_mint: Pubkey,
    pub quote_token_mint: Pubkey,
    pub lp_token_mint: Pubkey,
    pub pool_state_bump: u8,
    pub base_token_vault_bump: u8,
    pub quote_token_vault_bump: u8,
    pub lp_token_vault_bump: u8,
    pub compensation_parameter: u16, // Range from (0 - 200) / 100 = c. With only 025 increments
    #[derivative(Default(value = "false"))]
    pub debug: bool,
    pub reserved: PoolStateReserve,
}

const POOL_STATE_RESERVE_SIZE: usize = 512;

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
