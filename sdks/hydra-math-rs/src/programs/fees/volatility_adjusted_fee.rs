use crate::decimal::{Add, Compare, Decimal, Div, Mul, Pow, Sub};
use crate::programs::fees::error::FeeCalculatorError;
use std::ops::Neg;
use std::str::FromStr;
use std::time::{SystemTime, UNIX_EPOCH};

/// Fee calculator input parameters for [VolatilityAdjustedFee]
#[derive(Debug)]
pub struct VolatilityAdjustedFee {
    last_time: u64,
    this_time: u64,
    last_price: Decimal,
    this_price: Decimal,
    ewma_window: u64,
    last_ewma: Decimal,
    lambda: Decimal,
    velocity: Decimal,
    min_fee: Decimal,
    max_fee: Decimal,
}

#[derive(Default, Debug)]
pub struct FeeResult {
    pub last_time: u64,
    pub last_price: u64,
    pub last_ewma: u64,
}

impl Into<Vec<u64>> for FeeResult {
    fn into(self) -> Vec<u64> {
        vec![self.last_time, self.last_price, self.last_ewma]
    }
}

impl From<Vec<u64>> for FeeResult {
    fn from(vector: Vec<u64>) -> Self {
        FeeResult {
            last_time: vector[0],
            last_price: vector[1],
            last_ewma: vector[2],
        }
    }
}

impl Default for VolatilityAdjustedFee {
    fn default() -> Self {
        Self {
            last_time: 0,
            this_time: SystemTime::now()
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

impl VolatilityAdjustedFee {
    fn should_update(&self) -> bool {
        self.last_time > 0
            && self.this_time.checked_sub(self.last_time).unwrap() >= self.ewma_window
    }

    fn compute_ewma(&self) -> Decimal {
        if self.should_update() {
            // update
            println!("DEBUG: Updating ewma");

            // this_ewma = lambda * last_ewma + (1-lambda) * (this_price / last_price - 1)**2
            // * ewma_window / (this_time - last_time)

            // a = (1-lambda)
            let a = Decimal::one().sub(self.lambda).unwrap();

            // b = (this_price / last_price - 1)**2
            let b = self
                .this_price
                .div(self.last_price)
                .sub(Decimal::one())
                .unwrap()
                .pow(Decimal::two());

            // c = ewma_window / (this_time - last_time)
            let c = Decimal::from_u64(
                self.ewma_window
                    .checked_div(self.this_time.checked_sub(self.last_time).unwrap())
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

    pub fn compute(
        &self,
        input_amount: &Decimal,
    ) -> Result<(Decimal, Decimal, Decimal), FeeCalculatorError> {
        if self.min_fee.is_zero() || self.max_fee.is_zero() {
            return Ok((
                Decimal::from_scaled_amount(0, input_amount.scale),
                *input_amount,
                self.last_ewma,
            ));
        }

        let ewma = self.compute_ewma();

        // x = -ewma / 8
        let x = ewma.neg().div(Decimal::from_u64(8).to_compute_scale());

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

        Ok((fees, amount_ex_fees, ewma))
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use crate::decimal::Decimal;

    use super::*;

    #[test]
    fn test_compute_fees() {
        let fee = VolatilityAdjustedFee {
            this_price: Decimal::from_scaled_amount(3400, 0).to_compute_scale(),
            ..Default::default()
        };

        let (fees, amount_ex_fees, ewma) = fee
            .compute(&Decimal::from_scaled_amount(1000, 0).to_compute_scale())
            .unwrap();

        println!("Fee: {:?}", fee);
        println!("Fees: {:?}", fees.to_string());
        println!("Amount ex fees: {:?}", amount_ex_fees.to_string());
        println!("ewma: {:?}", ewma.to_string());
    }
}
