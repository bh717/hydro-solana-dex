use crate::decimal::{Add, Compare, Decimal, DecimalError, Div, Mul, Pow, Sub, COMPUTE_SCALE};
use crate::programs::fees::error::FeeCalculatorError;
use crate::programs::fees::fee_result::{FeeResult, FeeResultBuilder};
use std::ops::Neg;
use std::str::FromStr;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Default, Builder, Debug)]
#[builder(setter(into))]
pub struct FeeCalculator {
    #[builder(default = "Decimal::zero()")]
    percentage_fee_numerator: Decimal,
    #[builder(default = "Decimal::zero()")]
    percentage_fee_denominator: Decimal,
    #[builder(default = "Decimal::zero()")]
    vol_adj_fee_last_update: Decimal,
    #[builder(default = r#"
            Decimal::from_u64(SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("seconds")
                .as_secs()).to_compute_scale()
        "#)]
    vol_adj_fee_this_update: Decimal,
    #[builder(default = "Decimal::zero()")]
    vol_adj_fee_last_price: Decimal,
    #[builder(default = "Decimal::zero()")]
    vol_adj_fee_this_price: Decimal,
    #[builder(default = "Decimal::from_u64(3600).to_compute_scale()")]
    vol_adj_fee_ewma_window: Decimal,
    #[builder(default = r#"
            // 1.25^2/365/24
            Decimal::from_str("1.25")
                .unwrap()
                .to_compute_scale()
                .pow(Decimal::two())
                .div(Decimal::from_u64(24).to_compute_scale())
                .div(Decimal::from_u64(365).to_compute_scale())
        "#)]
    vol_adj_fee_last_ewma: Decimal,
    #[builder(default = r#"Decimal::from_str("0.545").unwrap().to_compute_scale()"#)]
    vol_adj_fee_lambda: Decimal,
    #[builder(default = r#"
            // 0.1 / 24 hours
            Decimal::from_str("0.1")
                .unwrap()
                .to_compute_scale()
                .div(Decimal::from_u64(24).to_compute_scale())
        "#)]
    vol_adj_fee_velocity: Decimal,
    #[builder(default = r#"Decimal::from_str("0.0005").unwrap().to_compute_scale()"#)]
    vol_adj_fee_min_fee: Decimal,
    #[builder(default = r#"Decimal::from_str("0.02").unwrap().to_compute_scale()"#)]
    vol_adj_fee_max_fee: Decimal,
}

impl FeeCalculator {
    /// Compute a volatility adjusted based fee for the [FeeCalculator]
    pub fn compute_vol_adj_fee(&self, amount: &Decimal) -> Result<FeeResult, FeeCalculatorError> {
        if self.vol_adj_fee_min_fee.is_zero() || self.vol_adj_fee_max_fee.is_zero() {
            return Ok(FeeResultBuilder::default().amount_ex_fee(*amount).build()?);
        }

        let this_ewma = self.compute_ewma()?;

        // x = -ewma / 8
        let x = this_ewma.neg().div(Decimal::from_u64(8).to_compute_scale());

        // exp(x) = 1+x+x^2/2
        // algo based on: https://docs.google.com/spreadsheets/d/1H5Kf5NIaV57KE3HOLbXTjcGDO-I_whhU/edit#gid=1189489672
        let exp_x = Decimal::one()
            .add(x)?
            .add(x.pow(2u128).div(Decimal::two()))?;

        let vol_adj_fee = Decimal::one().sub(exp_x)?.div(self.vol_adj_fee_velocity);

        // fee = MAX(min_fee,MIN(max_fee, vol_adj_fee)
        let fee_percentage = self
            .vol_adj_fee_min_fee
            .max(self.vol_adj_fee_max_fee.min(vol_adj_fee));

        let amount_scaled = amount.to_compute_scale();
        let fee_amount = fee_percentage.mul(amount_scaled);

        if fee_amount.gte(amount_scaled)? {
            return Err(FeeCalculatorError::FeesGreaterThanAmount.into());
        }

        if fee_percentage.is_zero() {
            return Ok(FeeResultBuilder::default()
                .fee_amount(Decimal::zero())
                .amount_ex_fee(*amount)
                .build()?);
        }

        let amount_ex_fee = amount.sub(fee_amount)?;

        Ok(FeeResultBuilder::default()
            .fee_amount(fee_amount.to_scale(amount.scale))
            .fee_percentage(fee_percentage.to_scale(amount.scale))
            .amount_ex_fee(amount_ex_fee.to_scale(amount.scale))
            .vol_adj_fee_last_update(self.vol_adj_fee_this_update.to_scale(0))
            .vol_adj_fee_last_price(self.vol_adj_fee_this_price.to_scale(amount.scale))
            .vol_adj_fee_last_ewma(this_ewma.to_scale(COMPUTE_SCALE))
            .build()?)
    }

    /// Compute a percentage based fee for the [FeeCalculator]
    pub fn compute_percent_fee(&self, amount: &Decimal) -> Result<FeeResult, FeeCalculatorError> {
        if self.percentage_fee_numerator.is_zero() || self.percentage_fee_denominator.is_zero() {
            return Ok(FeeResultBuilder::default().amount_ex_fee(*amount).build()?);
        }

        let fee_percentage = self
            .percentage_fee_numerator
            .div(self.percentage_fee_denominator);

        if fee_percentage.is_zero() {
            return Ok(FeeResultBuilder::default().amount_ex_fee(*amount).build()?);
        }

        let amount_scaled = amount.to_compute_scale();
        let fee_amount = fee_percentage.mul(amount_scaled);

        if fee_amount.gte(amount_scaled)? {
            return Err(FeeCalculatorError::FeesGreaterThanAmount.into());
        }

        let amount_ex_fee = amount_scaled.sub(fee_amount)?;

        Ok(FeeResultBuilder::default()
            .fee_amount(fee_amount.to_scale(amount.scale))
            .fee_percentage(fee_percentage.to_scale(amount.scale))
            .amount_ex_fee(amount_ex_fee.to_scale(amount.scale))
            .build()?)
    }

    /// Determine if variance should be computed based on window period for a volatility adjusted [FeeCalculator]
    fn should_update(&self) -> Result<bool, DecimalError> {
        Ok(self.vol_adj_fee_last_update.gt(Decimal::zero())?
            && self
                .vol_adj_fee_this_update
                .sub(self.vol_adj_fee_last_update)?
                >= self.vol_adj_fee_ewma_window)
    }

    /// Compute exponentially weighted moving average (ewma) variance for a volatility adjusted [FeeCalculator]
    /// algo based on https://docs.google.com/document/d/1ZLJocadDjbfdlVTzXofIvCfYT0xdDw24ciCuNCqCBIU/edit
    fn compute_ewma(&self) -> Result<Decimal, DecimalError> {
        if self.should_update()? {
            // this_ewma = lambda * last_ewma + (1-lambda) * (this_price / last_price - 1)**2
            // * ewma_window / (this_update - last_update)

            // a = (1-lambda)
            let a = Decimal::one().sub(self.vol_adj_fee_lambda)?;

            // b = (this_price / last_price - 1)**2
            let b = self
                .vol_adj_fee_this_price
                .div(self.vol_adj_fee_last_price)
                .sub(Decimal::one())?
                .pow(Decimal::two());

            // c = ewma_window / (this_update - last_update)
            let c = self.vol_adj_fee_ewma_window.div(
                self.vol_adj_fee_this_update
                    .sub(self.vol_adj_fee_last_update)?,
            );

            Ok(self
                .vol_adj_fee_lambda
                .mul(self.vol_adj_fee_last_ewma)
                .add(a.mul(b).mul(c))?)
        } else {
            Ok(self.vol_adj_fee_last_ewma)
        }
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use crate::decimal::Decimal;
    use rstest::rstest;

    #[test]
    fn test_compute_percent_fee() {
        let fee_calculator = FeeCalculatorBuilder::default()
            .percentage_fee_numerator(Decimal::from_u64(1).to_compute_scale())
            .percentage_fee_denominator(Decimal::from_u64(50).to_compute_scale())
            .build()
            .unwrap();

        let fee_result = fee_calculator
            .compute_percent_fee(&Decimal::from_scaled_amount(1000_000000, 6))
            .unwrap();

        assert_eq!(
            fee_result.fee_amount,
            Decimal {
                value: 20000000,
                scale: 6,
                negative: false,
            }
        );

        assert_eq!(
            fee_result.fee_percentage,
            Decimal {
                value: 20000,
                scale: 6,
                negative: false,
            }
        );

        assert_eq!(
            fee_result.amount_ex_fee,
            Decimal {
                value: 980000000,
                scale: 6,
                negative: false,
            }
        );
    }

    #[rstest]
    #[case("0", "2000", "0", "3.735928559", "0", "3.735928559")]
    #[case("1", "2000", "0.0005", "3.735928559", "0.00186796428", "3.734060594")]
    #[case("10", "2000", "0.005", "3.735928559", "0.0186796428", "3.717248916")]
    #[case("20", "2000", "0.01", "3.735928559", "0.03735928559", "3.698569273")]
    #[case("30", "2000", "0.015", "3.735928559", "0.05603892838", "3.679889630")]
    #[case("40", "2000", "0.02", "3.735928559", "0.07471857118", "3.661209987")]
    fn test_compute_percent_fee_table(
        #[case] percentage_fee_numerator: Decimal,
        #[case] percentage_fee_denominator: Decimal,
        #[case] fee_percentage: Decimal,
        #[case] amount: Decimal,
        #[case] fee_amount: Decimal,
        #[case] amount_ex_fee: Decimal,
    ) {
        let fee_calculator = FeeCalculatorBuilder::default()
            .percentage_fee_numerator(percentage_fee_numerator.to_compute_scale())
            .percentage_fee_denominator(percentage_fee_denominator.to_compute_scale())
            .build()
            .unwrap();

        let fee_result = fee_calculator
            .compute_percent_fee(&amount.to_compute_scale())
            .unwrap();

        assert_eq!(
            fee_result.fee_percentage.to_scale(9),
            fee_percentage.to_scale(9)
        );
        assert_eq!(fee_result.fee_amount.to_scale(9), fee_amount.to_scale(9));
        assert_eq!(
            fee_result.amount_ex_fee.to_scale(9),
            amount_ex_fee.to_scale(9)
        );
    }

    #[test]
    fn test_compute_vol_adj_fee() {
        let fee_calculator = FeeCalculatorBuilder::default()
            .vol_adj_fee_this_price(Decimal::from_scaled_amount(3400, 0).to_compute_scale())
            .build()
            .unwrap();

        let fee_result = fee_calculator
            .compute_vol_adj_fee(&Decimal::from_scaled_amount(1000, 0).to_compute_scale())
            .unwrap();

        assert_eq!(
            fee_result.fee_amount,
            Decimal {
                value: 5351086800000,
                scale: 12,
                negative: false,
            }
        );

        assert_eq!(
            fee_result.fee_percentage,
            Decimal {
                value: 5351086800,
                scale: 12,
                negative: false,
            }
        );

        assert_eq!(
            fee_result.amount_ex_fee,
            Decimal {
                value: 994648913200000,
                scale: 12,
                negative: false,
            }
        );
    }

    // #[test]
    // fn test_compute_vol_adj_fee_wasm() {
    //     // first time called with 'zero' input for last_price, last_update and last_ewma
    //     {
    //         let actual =
    //             compute_volatility_adjusted_fee(3400_000000, 0, 6, 0, 0, 1000_000000, 6).unwrap();
    //         let result = FeeResult::from(actual);
    //         let expected = FeeResult {
    //             fees: 5351086800000,
    //             amount_ex_fees: 994648913200000,
    //             last_update: 1649549126,
    //             last_price: 3400000000000000,
    //             last_ewma: 178367579,
    //         };
    //
    //         assert_eq!(result.fees, expected.fees);
    //         assert_eq!(result.amount_ex_fees, expected.amount_ex_fees);
    //         assert_eq!(result.last_price, expected.last_price);
    //         assert_eq!(result.last_ewma, expected.last_ewma);
    //     }
    //
    //     // second time called, passing in previous values last_price, last_update and last_ewma
    //     // which need to be stored on chain
    //     {
    //         let last_update = SystemTime::now()
    //             .duration_since(UNIX_EPOCH)
    //             .expect("seconds")
    //             .as_secs()
    //             .checked_sub(3600)
    //             .unwrap();
    //
    //         let actual = compute_volatility_adjusted_fee(
    //             3425_000000,
    //             3400_000000,
    //             6,
    //             last_update,
    //             178367579,
    //             1000_000000,
    //             6,
    //         )
    //         .unwrap();
    //         let result = FeeResult::from(actual);
    //         let expected = FeeResult {
    //             fees: 3654334800000,
    //             amount_ex_fees: 996345665200000,
    //             last_update: 1649549126,
    //             last_price: 3425000000000000,
    //             last_ewma: 121810243,
    //         };
    //         assert_eq!(result.fees, expected.fees);
    //         assert_eq!(result.amount_ex_fees, expected.amount_ex_fees);
    //         assert_eq!(result.last_price, expected.last_price);
    //         assert_eq!(result.last_ewma, expected.last_ewma);
    //     }
    // }
}
