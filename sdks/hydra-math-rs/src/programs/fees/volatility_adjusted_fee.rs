use crate::decimal::{Add, Compare, Decimal, Div, Mul, Pow, Sub, COMPUTE_SCALE};
use crate::programs::fees::error::FeeCalculatorError;
use std::ops::Neg;
use std::str::FromStr;
use std::time::{SystemTime, UNIX_EPOCH};
use wasm_bindgen::prelude::wasm_bindgen;

/// Interface to be used by programs and front end
/// these functions shadow functions of the implemented fee calculator
#[wasm_bindgen]
pub fn compute_volatility_adjusted_fee(
    this_price: u64,
    last_price: u64,
    price_scale: u8,
    last_update: u64,
    last_ewma: u64,
    amount: u64,
    amount_scale: u8,
) -> Result<Vec<u64>, String> {
    let calculator = FeeCalculator::builder()
        .this_price(this_price, price_scale)
        .last_price(last_price, price_scale)
        .last_update(last_update)
        .last_ewma(last_ewma)
        .build()?;

    let fees = calculator
        .compute_fees(&Decimal::from_scaled_amount(amount, amount_scale).to_compute_scale())
        .unwrap();

    Ok(fees.into())
}

/// Input parameters for [FeeCalculator]
#[derive(Debug)]
pub struct FeeCalculator {
    /// Last update time in seconds since epoch, provided by client
    last_update: u64,
    /// Update time in seconds since epoch, calculated internally
    this_update: u64,
    /// Last price from oracle, provided by client
    last_price: Decimal,
    /// Current price from oracle, provided by client
    this_price: Decimal,
    /// EWMA window in seconds, default 3600
    ewma_window: u64,
    /// Last EWMA calculated, provided by client
    last_ewma: Decimal,
    /// EWMA smoothing lambda, default 0.545
    lambda: Decimal,
    /// EWMA velocity period, default 10% of 24 hours
    velocity: Decimal,
    /// Minimum fee percentage, default 0.0005
    min_fee: Decimal,
    /// Maximum fee percentage, default 0.0005
    max_fee: Decimal,
}

#[derive(Debug, Default)]
pub struct FeeCalculatorBuilder {
    pub this_price: Option<Decimal>,
    pub last_price: Option<Decimal>,
    pub last_update: Option<u64>,
    pub last_ewma: Option<Decimal>,
}

impl FeeCalculatorBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn last_update(self, seconds: u64) -> Self {
        Self {
            last_update: Some(seconds),
            ..self
        }
    }

    pub fn this_price(self, amount: u64, scale: u8) -> Self {
        Self {
            this_price: Some(Decimal::from_scaled_amount(amount, scale).to_compute_scale()),
            ..self
        }
    }

    pub fn last_price(self, amount: u64, scale: u8) -> Self {
        Self {
            last_price: Some(Decimal::from_scaled_amount(amount, scale).to_compute_scale()),
            ..self
        }
    }

    pub fn last_ewma(self, amount: u64) -> Self {
        Self {
            last_ewma: Some(if amount == 0 {
                Decimal::from_str("1.25")
                    .unwrap()
                    .to_compute_scale()
                    .pow(Decimal::two())
                    .div(Decimal::from_u64(24).to_compute_scale())
                    .div(Decimal::from_u64(365).to_compute_scale())
            } else {
                Decimal::from_scaled_amount(amount, COMPUTE_SCALE)
            }),
            ..self
        }
    }

    pub fn build(self) -> Result<FeeCalculator, String> {
        let this_price = self
            .this_price
            .ok_or(FeeCalculatorError::BuilderIncomplete)
            .unwrap();

        let last_price = self
            .last_price
            .ok_or(FeeCalculatorError::BuilderIncomplete)
            .unwrap();

        let last_update = self
            .last_update
            .ok_or(FeeCalculatorError::BuilderIncomplete)
            .unwrap();

        let last_ewma = self
            .last_ewma
            .ok_or(FeeCalculatorError::BuilderIncomplete)
            .unwrap();

        Ok(FeeCalculator {
            this_price,
            last_price,
            last_update,
            last_ewma,
            ..Default::default()
        })
    }
}

#[derive(Default, Debug, PartialEq)]
pub struct FeeResult {
    pub fees: u64,
    pub amount_ex_fees: u64,
    pub last_update: u64,
    pub last_price: u64,
    pub last_ewma: u64,
}

impl Into<Vec<u64>> for FeeResult {
    fn into(self) -> Vec<u64> {
        vec![
            self.fees,
            self.amount_ex_fees,
            self.last_update,
            self.last_price,
            self.last_ewma,
        ]
    }
}

impl From<Vec<u64>> for FeeResult {
    fn from(vector: Vec<u64>) -> Self {
        FeeResult {
            fees: vector[0],
            amount_ex_fees: vector[1],
            last_update: vector[2],
            last_price: vector[3],
            last_ewma: vector[4],
        }
    }
}

impl Default for FeeCalculator {
    fn default() -> Self {
        Self {
            last_update: 0,
            this_update: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("seconds")
                .as_secs(),
            last_price: Decimal::from_u64(0).to_compute_scale(),
            this_price: Decimal::from_u64(0).to_compute_scale(),
            // 1h = 3600 seconds
            ewma_window: 3600,
            // 1.25^2/365/24
            last_ewma: Decimal::from_str("1.25")
                .unwrap()
                .to_compute_scale()
                .pow(Decimal::two())
                .div(Decimal::from_u64(24).to_compute_scale())
                .div(Decimal::from_u64(365).to_compute_scale()),
            // 0.545
            lambda: Decimal::from_str("0.545").unwrap().to_compute_scale(),
            // 0.1 / 24 hours
            velocity: Decimal::from_str("0.1")
                .unwrap()
                .to_compute_scale()
                .div(Decimal::from_u64(24).to_compute_scale()),
            // 0.0005
            min_fee: Decimal::from_str("0.0005").unwrap().to_compute_scale(),
            // 0.02
            max_fee: Decimal::from_str("0.02").unwrap().to_compute_scale(),
        }
    }
}

impl FeeCalculator {
    pub fn builder() -> FeeCalculatorBuilder {
        FeeCalculatorBuilder::new()
    }

    fn should_update(&self) -> bool {
        self.last_update > 0
            && self.this_update.checked_sub(self.last_update).unwrap() >= self.ewma_window
    }

    fn compute_ewma(&self) -> Decimal {
        if self.should_update() {
            // this_ewma = lambda * last_ewma + (1-lambda) * (this_price / last_price - 1)**2
            // * ewma_window / (this_update - last_update)

            // a = (1-lambda)
            let a = Decimal::one().sub(self.lambda).unwrap();

            // b = (this_price / last_price - 1)**2
            let b = self
                .this_price
                .div(self.last_price)
                .sub(Decimal::one())
                .unwrap()
                .pow(Decimal::two());

            // c = ewma_window / (this_update - last_update)
            let c = Decimal::from_u64(
                self.ewma_window
                    .checked_div(self.this_update.checked_sub(self.last_update).unwrap())
                    .unwrap(),
            )
            .to_compute_scale();

            self.lambda
                .mul(self.last_ewma)
                .add(a.mul(b).mul(c))
                .unwrap()
        } else {
            self.last_ewma
        }
    }

    pub fn compute_fees(&self, input_amount: &Decimal) -> Result<FeeResult, FeeCalculatorError> {
        if self.min_fee.is_zero() || self.max_fee.is_zero() {
            return Ok(FeeResult {
                fees: 0,
                amount_ex_fees: input_amount.to_scaled_amount(input_amount.scale),
                last_update: self.this_update,
                last_price: self.this_price.to_scaled_amount(self.this_price.scale),
                last_ewma: self.last_ewma.to_scaled_amount(COMPUTE_SCALE),
            });
        }

        let this_ewma = self.compute_ewma();

        // x = -ewma / 8
        let x = this_ewma.neg().div(Decimal::from_u64(8).to_compute_scale());

        // exp(x) = 1+x+x^2/2
        let exp_x = Decimal::one()
            .add(x)
            .unwrap()
            .add(x.pow(2u128).div(Decimal::two()))
            .unwrap();

        let vol_adj_fee = Decimal::one().sub(exp_x).unwrap().div(self.velocity);

        // fee = MAX(min_fee,MIN(max_fee, vol_adj_fee)
        let fee = self.min_fee.max(self.max_fee.min(vol_adj_fee));

        let amount_scaled = input_amount.to_compute_scale();
        let fees = fee.mul(amount_scaled);

        if fees.gte(amount_scaled).unwrap() {
            return Err(FeeCalculatorError::FeesGreaterThanAmount.into());
        }

        let amount_ex_fees = input_amount.sub(fees).expect("amount_ex_fees");

        Ok(FeeResult {
            fees: fees.to_scaled_amount(input_amount.scale),
            amount_ex_fees: amount_ex_fees.to_scaled_amount(input_amount.scale),
            last_update: self.this_update,
            last_price: self.this_price.to_scaled_amount(self.this_price.scale),
            last_ewma: this_ewma.to_scaled_amount(COMPUTE_SCALE),
        })
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use crate::decimal::Decimal;

    use super::*;

    #[test]
    fn test_compute_fees() {
        let fee = FeeCalculator {
            this_price: Decimal::from_scaled_amount(3400, 0).to_compute_scale(),
            ..Default::default()
        };

        let fees = fee
            .compute_fees(&Decimal::from_scaled_amount(1000, 0).to_compute_scale())
            .unwrap();

        println!("Fees: {:?}", fees);
    }

    #[test]
    fn test_scalar_inputs() {
        // first time called with 'zero' input for last_price, last_update and last_ewma
        {
            let actual =
                compute_volatility_adjusted_fee(3400_000000, 0, 6, 0, 0, 1000_000000, 6).unwrap();
            let result = FeeResult::from(actual);
            let expected = FeeResult {
                fees: 5351086800000,
                amount_ex_fees: 994648913200000,
                last_update: 1649549126,
                last_price: 3400000000000000,
                last_ewma: 178367579,
            };

            assert_eq!(result.fees, expected.fees);
            assert_eq!(result.amount_ex_fees, expected.amount_ex_fees);
            assert_eq!(result.last_price, expected.last_price);
            assert_eq!(result.last_ewma, expected.last_ewma);
        }

        // second time called, passing in previous values last_price, last_update and last_ewma
        // which need to be stored on chain
        {
            let last_update = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("seconds")
                .as_secs()
                .checked_sub(3600)
                .unwrap();

            let actual = compute_volatility_adjusted_fee(
                3425_000000,
                3400_000000,
                6,
                last_update,
                178367579,
                1000_000000,
                6,
            )
            .unwrap();
            let result = FeeResult::from(actual);
            let expected = FeeResult {
                fees: 3654334800000,
                amount_ex_fees: 996345665200000,
                last_update: 1649549126,
                last_price: 3425000000000000,
                last_ewma: 121810243,
            };
            assert_eq!(result.fees, expected.fees);
            assert_eq!(result.amount_ex_fees, expected.amount_ex_fees);
            assert_eq!(result.last_price, expected.last_price);
            assert_eq!(result.last_ewma, expected.last_ewma);
        }
    }
}
