use crate::errors::ErrorCode;
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

impl PoolState {
    // TODO this is doggy fix me
    pub fn set_compensation_parameter(value: u16) -> Result<u16> {
        match value {
            0 => Ok(0),
            025 => Ok(025),
            050 => Ok(050),
            075 => Ok(075),
            1 => Ok(100),
            100 => Ok(100),
            125 => Ok(125),
            150 => Ok(150),
            175 => Ok(175),
            2 => Ok(200),
            200 => Ok(200),
            _ => err!(ErrorCode::InvalidCompensationParameter),
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::state::pool_state::PoolState;

    #[test]
    fn test_set_compensation_parameter0() {
        let expected: u16 = 0;
        let result = PoolState::set_compensation_parameter(0).unwrap();
        assert_eq!(expected, result)
    }

    #[test]
    fn test_set_compensation_parameter025() {
        let expected: u16 = 025;
        let result = PoolState::set_compensation_parameter(025).unwrap();
        assert_eq!(expected, result)
    }

    #[test]
    fn test_set_compensation_parameter050() {
        let expected: u16 = 050;
        let result = PoolState::set_compensation_parameter(050).unwrap();
        assert_eq!(expected, result)
    }
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
