use crate::decimal::{Compare, Decimal, Mul, Sub};
use crate::programs::fees::error::FeeCalculatorError;
use wasm_bindgen::prelude::wasm_bindgen;

/// Interface to be used by programs and front end
/// these functions shadow functions of the implemented fee calculator
#[wasm_bindgen]
pub fn compute_percentage_fee(
    percentage: u64,
    amount: u64,
    amount_scale: u8,
) -> Result<Vec<u64>, String> {
    let calculator = FeeCalculator::new(Decimal::from_scaled_amount(percentage, amount_scale));
    let fees = calculator
        .compute_fees(&Decimal::from_scaled_amount(amount, amount_scale).to_compute_scale())
        .unwrap();

    Ok(fees.into())
}

#[derive(Default, Debug)]
pub struct FeeResult {
    pub fees: u64,
    pub amount_ex_fees: u64,
}

impl Into<Vec<u64>> for FeeResult {
    fn into(self) -> Vec<u64> {
        vec![self.fees, self.amount_ex_fees]
    }
}

impl From<Vec<u64>> for FeeResult {
    fn from(vector: Vec<u64>) -> Self {
        FeeResult {
            fees: vector[0],
            amount_ex_fees: vector[1],
        }
    }
}

/// Fee calculator input parameters for [PercentageFee]
#[derive(Debug)]
pub struct FeeCalculator {
    percentage: Decimal,
}

impl Default for FeeCalculator {
    fn default() -> Self {
        Self {
            percentage: Default::default(),
        }
    }
}

impl FeeCalculator {
    pub fn new(percentage: Decimal) -> Self {
        Self { percentage }
    }

    pub fn compute_fees(&self, input_amount: &Decimal) -> Result<FeeResult, FeeCalculatorError> {
        if self.percentage.is_zero() {
            return Ok(FeeResult {
                fees: 0,
                amount_ex_fees: input_amount.to_scaled_amount(input_amount.scale),
            });
        }

        let scaled_percentage = self.percentage.to_scale(input_amount.scale);

        let fees = input_amount.mul(scaled_percentage);

        if fees.gte(*input_amount).unwrap() {
            return Err(FeeCalculatorError::FeesGreaterThanAmount.into());
        }

        let amount_ex_fees = input_amount.sub(fees).expect("amount_ex_fees");

        Ok(FeeResult {
            fees: fees.to_scaled_amount(input_amount.scale),
            amount_ex_fees: amount_ex_fees.to_scaled_amount(input_amount.scale),
        })
    }
}
