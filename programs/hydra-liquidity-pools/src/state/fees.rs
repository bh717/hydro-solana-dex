use crate::errors::ErrorCode;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Default, Clone, Debug)]
pub struct Fees {
    // Swap fees are tokens that charged for a swap and added to the liquidity pools, rising the value of the lp tokens.
    pub swap_fee_numerator: u64,
    pub swap_fee_denominator: u64,

    // TODO: Added due to solana's one time struct sizing onchain.
    // TODO: Build out below features in due course.
    pub owner_trade_fee_numerator: u64,
    pub owner_trade_fee_denominator: u64,
    pub owner_withdraw_fee_numerator: u64,
    pub owner_withdraw_fee_denominator: u64,
    pub host_fee_numerator: u64,
    pub host_fee_denominator: u64,
}

impl Fees {
    pub fn validate(&self) -> Result<()> {
        validate_fraction(self.swap_fee_numerator, self.swap_fee_denominator)
    }
}

fn validate_fraction(numerator: u64, denominator: u64) -> Result<()> {
    if denominator == 0 && numerator == 0 {
        Ok(())
    } else if numerator >= denominator {
        Err(ErrorCode::InvalidFee.into())
    } else {
        Ok(())
    }
}
