use crate::decimal::{Add, Compare, Decimal, Div, Mul, Pow, Sub};
use crate::programs::fees::error::FeeCalculatorError;
use std::str::FromStr;
use std::time::{SystemTime, UNIX_EPOCH};

/// Fee calculator input parameters for [VolatilityAdjustedFee]
#[derive(Debug)]
pub struct VolatilityAdjustedFee {
    last_ewma_update_time: u64,
    last_ewma_update_price: Decimal,
    current_price: Decimal,
    ewma_window: u64,
    ewma_var: Decimal,
    lambda: Decimal,
    velocity: Decimal,
    min_fee: Decimal,
    max_fee: Decimal,
}

impl Default for VolatilityAdjustedFee {
    fn default() -> Self {
        Self {
            last_ewma_update_time: 0,
            last_ewma_update_price: Decimal::from_u64(0).to_compute_scale(),
            current_price: Decimal::from_u64(0).to_compute_scale(),
            // 1h = 3600 seconds
            ewma_window: 3600,
            // 1.25/(24/365)
            ewma_var: Decimal::from_str("1.25").unwrap().to_compute_scale().div(
                Decimal::from_u64(24)
                    .to_compute_scale()
                    .div(Decimal::from_u64(365).to_compute_scale()),
            ),
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
    pub fn new(
        last_ewma_update_time: u64,
        last_ewma_update_price: Decimal,
        current_price: Decimal,
        ewma_window: u64,
        ewma_var: Decimal,
        lambda: Decimal,
        velocity: Decimal,
        min_fee: Decimal,
        max_fee: Decimal,
    ) -> Self {
        Self {
            last_ewma_update_time,
            last_ewma_update_price,
            current_price,
            ewma_window,
            ewma_var,
            lambda,
            velocity,
            min_fee,
            max_fee,
        }
    }

    pub fn compute(
        &self,
        input_amount: &Decimal,
    ) -> Result<(Decimal, Decimal), FeeCalculatorError> {
        if self.min_fee.is_zero() || self.max_fee.is_zero() {
            return Ok((
                Decimal::from_scaled_amount(0, input_amount.scale),
                *input_amount,
            ));
        }

        let start = SystemTime::now();
        let current_time = start.duration_since(UNIX_EPOCH).expect("seconds").as_secs();
        if current_time
            .checked_sub(self.last_ewma_update_time)
            .unwrap()
            > self.ewma_window
        {
            // update
            println!("DEBUG: Updating");
            let one = Decimal::from_u64(1).to_compute_scale();
            let two = Decimal::from_u64(2).to_compute_scale();

            // ewma_var = lambda * ewma_var + (1-lambda) * (current_price / last_ewma_update_price - 1)**2 * ewma_window / (current_time - Last_ewma_update_time)

            // a = (1-lambda)
            let a = one.sub(self.lambda).unwrap();

            // b = (current_price / last_ewma_update_price - 1)**2
            let b = self
                .current_price
                .div(self.last_ewma_update_price)
                .sub(one)
                .unwrap()
                .pow(two);

            // c = ewma_window / (current_time - Last_ewma_update_time)
            let c = Decimal::from_u64(
                self.ewma_window
                    .checked_div(
                        current_time
                            .checked_sub(self.last_ewma_update_time)
                            .unwrap(),
                    )
                    .unwrap(),
            )
            .to_compute_scale();

            let ewma_var = self.lambda.mul(self.ewma_var).add(a.mul(b).mul(c)).unwrap();
        }

        // fee = MAX(min_fee,MIN(max_fee, (1-math.exp(-ewma_var/8))/velocity))

        let scaled_percentage = self.max_fee.to_scale(input_amount.scale);

        let fees = input_amount.mul(scaled_percentage);

        if fees.gte(*input_amount).unwrap() {
            return Err(FeeCalculatorError::FeesGreaterThanAmount.into());
        }

        let amount_ex_fees = input_amount.sub(fees).expect("amount_ex_fees");

        Ok((fees, amount_ex_fees))
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use crate::decimal::Decimal;

    use super::*;

    #[test]
    fn test_compute_fees() {
        let fee = VolatilityAdjustedFee::new(
            0,
            Decimal::from_u64(0).to_compute_scale(),
            Decimal::from_u64(1).to_compute_scale(),
            Default::default(),
            Default::default(),
            Default::default(),
            Default::default(),
            Default::default(),
            Default::default(),
        );

        let (fees, amount_ex_fees) = fee
            .compute(&Decimal::from_u64(1000).to_compute_scale())
            .unwrap();

        println!("Fees: {:?}", fees);
        println!("Amount ex fees: {:?}", amount_ex_fees);
    }
}
