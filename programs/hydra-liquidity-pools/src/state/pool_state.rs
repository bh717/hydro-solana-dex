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
    _padding: PoolStatePadding,
}
impl PoolState {}

const POOL_STATE_PADDING_SIZE: usize = 511;

#[derive(Clone, Debug)]
pub struct PoolStatePadding([u8; POOL_STATE_PADDING_SIZE]);

impl AnchorSerialize for PoolStatePadding {
    fn serialize<W: Write>(&self, writer: &mut W) -> std::io::Result<()> {
        writer.write_all(&self.0)
    }
}

impl AnchorDeserialize for PoolStatePadding {
    fn deserialize(buf: &mut &[u8]) -> std::io::Result<Self> {
        Ok(Self([0u8; POOL_STATE_PADDING_SIZE]))
    }
}

impl Default for PoolStatePadding {
    fn default() -> Self {
        PoolStatePadding {
            0: [0u8; POOL_STATE_PADDING_SIZE],
        }
    }
}
