use crate::decimal::{Compare, Decimal, Mul, Sub};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum FeeCalculatorError {
    #[error("Fees are greater than input amount")]
    FeesGreaterThanAmount,
}

/// Fee calculator input parameters for [PercentageFee]
#[derive(Debug)]
pub struct PercentageFee {
    percentage: Decimal,
}

impl Default for PercentageFee {
    fn default() -> Self {
        Self {
            percentage: Default::default(),
        }
    }
}

impl PercentageFee {
    pub fn new(percentage: Decimal) -> Self {
        Self { percentage }
    }

    pub fn compute(
        &self,
        input_amount: &Decimal,
    ) -> Result<(Decimal, Decimal), FeeCalculatorError> {
        if self.percentage.is_zero() {
            return Ok((
                Decimal::from_scaled_amount(0, input_amount.scale),
                *input_amount,
            ));
        }

        let scaled_percentage = self.percentage.to_scale(input_amount.scale);

        let fees = input_amount.mul(scaled_percentage);

        if fees.gte(*input_amount).unwrap() {
            return Err(FeeCalculatorError::FeesGreaterThanAmount.into());
        }

        let amount_ex_fees = input_amount.sub(fees).expect("amount_ex_fees");

        Ok((fees, amount_ex_fees))
    }
}
