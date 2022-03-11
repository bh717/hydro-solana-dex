use crate::errors::ErrorCode;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Default, Clone, Debug)]
pub struct Fees {
    pub trade_fee_numerator: u64,
    pub trade_fee_denominator: u64,
}

impl Fees {
    pub fn validate(&self) -> Result<()> {
        validate_fraction(self.trade_fee_numerator, self.trade_fee_denominator)
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
