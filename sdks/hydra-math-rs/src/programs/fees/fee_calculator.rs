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

        let amount_ex_fee = amount_scaled.sub(fee_amount)?;

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
            return Ok(FeeResultBuilder::default()
                .fee_amount(Decimal::zero().to_scale(amount.scale))
                .fee_percentage(Decimal::zero().to_scale(amount.scale))
                .amount_ex_fee(*amount)
                .build()?);
        }

        let fee_percentage = self
            .percentage_fee_numerator
            .to_compute_scale()
            .div(self.percentage_fee_denominator.to_compute_scale());

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
        Ok(self
            .vol_adj_fee_last_update
            .to_compute_scale()
            .gt(Decimal::zero())?
            && self
                .vol_adj_fee_this_update
                .sub(self.vol_adj_fee_last_update.to_compute_scale())?
                >= self.vol_adj_fee_ewma_window)
    }

    /// Compute exponentially weighted moving average (ewma) variance for a volatility adjusted [FeeCalculator]
    /// algo based on https://docs.google.com/document/d/1ZLJocadDjbfdlVTzXofIvCfYT0xdDw24ciCuNCqCBIU/edit
    fn compute_ewma(&self) -> Result<Decimal, DecimalError> {
        if self.should_update()? {
            // this_ewma = lambda * last_ewma + (1-lambda) * (this_price / last_price - 1)**2
            // * ewma_window / (this_update - last_update)

            // ensure all scale is uniform
            let lambda = self.vol_adj_fee_lambda.to_compute_scale();
            let this_price = self.vol_adj_fee_this_price.to_compute_scale();
            let last_price = self.vol_adj_fee_last_price.to_compute_scale();
            let this_update = self.vol_adj_fee_this_update.to_compute_scale();
            let last_update = self.vol_adj_fee_last_update.to_compute_scale();
            let last_ewma = self.vol_adj_fee_last_ewma.to_compute_scale();
            let ewma_window = self.vol_adj_fee_ewma_window.to_compute_scale();

            // a = (1-lambda)
            let a = Decimal::one().sub(lambda)?;

            // b = (this_price / last_price - 1)**2
            let b = this_price
                .div(last_price)
                .sub(Decimal::one())?
                .pow(Decimal::two());

            // c = ewma_window / (this_update - last_update)
            let c = ewma_window.div(this_update.sub(last_update)?);

            Ok(lambda.mul(last_ewma).add(a.mul(b).mul(c))?)
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
    use csv::ReaderBuilder;
    use indoc::indoc;

    #[test]
    fn test_compute_percent_fee() {
        let fee_calculator = FeeCalculatorBuilder::default()
            .percentage_fee_numerator(Decimal::from_u64(1))
            .percentage_fee_denominator(Decimal::from_u64(50))
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

    #[test]
    fn test_compute_percent_fee_tables() {
        let data = indoc! {r#"
        numerator	denominator	fee_percentage	amount	fee_amount	amount_ex_fee
        0	2000	0	3.735928559	0.000000000000	3.735928559000
        1	2000	0.0005	3.735928559	0.001867964280	3.734060594721
        10	2000	0.005	3.735928559	0.018679642795	3.717248916205
        20	2000	0.01	3.735928559	0.037359285590	3.698569273410
        30	2000	0.015	3.735928559	0.056038928385	3.679889630615
        40	2000	0.02	3.735928559	0.074718571180	3.661209987820"#};
        let mut reader = ReaderBuilder::new()
            .delimiter(b'\t')
            .from_reader(data.as_bytes());

        for record in reader.records() {
            let record = record.unwrap();
            let percentage_fee_numerator =
                Decimal::from_str(&record[0]).unwrap().to_compute_scale();
            let percentage_fee_denominator =
                Decimal::from_str(&record[1]).unwrap().to_compute_scale();
            let fee_percentage = Decimal::from_str(&record[2]).unwrap();
            let amount = Decimal::from_str(&record[3]).unwrap();
            let fee_amount = Decimal::from_str(&record[4]).unwrap();
            let amount_ex_fee = Decimal::from_str(&record[5]).unwrap();

            let fee_calculator = FeeCalculatorBuilder::default()
                .percentage_fee_numerator(percentage_fee_numerator)
                .percentage_fee_denominator(percentage_fee_denominator)
                .build()
                .unwrap();

            let fee_result = fee_calculator.compute_percent_fee(&amount).unwrap();

            // test fee_amount
            assert!(
                fee_result.fee_amount.almost_eq(fee_amount, 1u128).unwrap(),
                "fee_amount actual: {} expected: {}",
                fee_result.fee_amount.to_string(),
                fee_amount.to_string()
            );

            // test amount_ex_fee
            assert!(
                fee_result
                    .amount_ex_fee
                    .almost_eq(amount_ex_fee, 1u128)
                    .unwrap(),
                "amount_ex_fee actual: {} expected: {}",
                fee_result.amount_ex_fee.to_string(),
                amount_ex_fee.to_string()
            );

            // test fee_percentage
            assert!(
                fee_result
                    .fee_percentage
                    .almost_eq(fee_percentage.to_compute_scale(), 1u128)
                    .unwrap(),
                "fee_percentage actual: {} expected: {}",
                fee_result.fee_percentage.to_string(),
                fee_percentage.to_string()
            );
        }
    }

    #[test]
    fn test_compute_vol_adj_fee() {
        {
            let fee_calculator = FeeCalculatorBuilder::default()
                .vol_adj_fee_this_price(Decimal::from_scaled_amount(3400_000000, 6))
                .build()
                .unwrap();

            let fee_result = fee_calculator
                .compute_vol_adj_fee(&Decimal::from_scaled_amount(1000_000000, 6))
                .unwrap();

            assert_eq!(
                fee_result.fee_amount,
                Decimal {
                    value: 5350967,
                    scale: 6,
                    negative: false,
                }
            );

            assert_eq!(
                fee_result.fee_percentage,
                Decimal {
                    value: 5350,
                    scale: 6,
                    negative: false,
                }
            );

            assert_eq!(
                fee_result.amount_ex_fee,
                Decimal {
                    value: 994649032,
                    scale: 6,
                    negative: false,
                }
            );
        }
    }

    #[test]
    fn test_compute_vol_adj_fee_tables() {
        let data = indoc! {r#"
        last_update	this_update	last_price	this_price	last_ewma	this_ewma	fee_percentage	amount	fee_amount	amount_ex_fee
        0	1649113200	0.000000	3400.000000	0.000178367580	0.000178367580	0.005351	1000.000000	5.350968	994.649032
        1649113200	1649116800	3400.000000	3425.000000	0.000178367580	0.000121810245	0.003654	1000.000000	3.654280	996.345720
        1649116800	1649120800	3425.000000	3420.000000	0.000121810245	0.000067259299	0.002018	1000.000000	2.017770	997.982230
        1649120800	1649124400	3420.000000	3415.000000	0.000067259299	0.000037628839	0.001129	1000.000000	1.128863	998.871137
        1649124400	1649128000	3415.000000	3418.000000	0.000037628839	0.000020858851	0.000626	1000.000000	0.625765	999.374235
        1649128000	1649130000	3418.000000	3420.000000	0.000020858851	0.000020858851	0.000626	1000.000000	0.625765	999.374235
        1649130000	1649134000	3420.000000	3421.000000	0.000020858851	0.000011403085	0.000500	1000.000000	0.500000	999.500000
        1649134000	1649137700	3421.000000	3270.000000	0.000011403085	0.000868716301	0.020000	1000.000000	20.000000	980.000000
        1649137700	1649141900	3270.000000	3210.000000	0.000868716301	0.000604752463	0.018142	1000.000000	18.141888	981.858112
        1649141900	1649142200	3210.000000	3230.000000	0.000604752463	0.000604752463	0.018142	1000.000000	18.141888	981.858112
        1649142200	1649146700	3230.000000	3211.000000	0.000604752463	0.000342185248	0.010265	1000.000000	10.265338	989.734662
        1649146700	1649151200	3211.000000	3220.000000	0.000342185248	0.000189350564	0.005680	1000.000000	5.680450	994.319550
        1649151200	1649155700	3220.000000	3220.000000	0.000189350564	0.000103196057	0.003096	1000.000000	3.095862	996.904138"#};
        let mut reader = ReaderBuilder::new()
            .delimiter(b'\t')
            .from_reader(data.as_bytes());

        for record in reader.records() {
            let record = record.unwrap();
            let percentage_fee_numerator = Decimal::zero();
            let percentage_fee_denominator = Decimal::zero();
            let vol_adj_fee_last_update = Decimal::from_str(&record[0]).unwrap().to_compute_scale();
            let vol_adj_fee_this_update = Decimal::from_str(&record[1]).unwrap().to_compute_scale();
            let vol_adj_fee_last_price = Decimal::from_str(&record[2]).unwrap();
            let vol_adj_fee_this_price = Decimal::from_str(&record[3]).unwrap();
            let vol_adj_fee_last_ewma = Decimal::from_str(&record[4]).unwrap();
            let this_ewma = Decimal::from_str(&record[5]).unwrap();
            let fee_percentage = Decimal::from_str(&record[6]).unwrap();
            let amount = Decimal::from_str(&record[7]).unwrap();
            let fee_amount = Decimal::from_str(&record[8]).unwrap();
            let amount_ex_fee = Decimal::from_str(&record[9]).unwrap();

            let fee_calculator = FeeCalculatorBuilder::default()
                .vol_adj_fee_last_update(vol_adj_fee_last_update)
                .vol_adj_fee_this_update(vol_adj_fee_this_update)
                .vol_adj_fee_last_price(vol_adj_fee_last_price)
                .vol_adj_fee_this_price(vol_adj_fee_this_price)
                .vol_adj_fee_last_ewma(vol_adj_fee_last_ewma)
                .build()
                .unwrap();

            let fee_result = fee_calculator.compute_vol_adj_fee(&amount).unwrap();

            // test vol_adj_fee_last_ewma
            assert!(
                fee_result
                    .vol_adj_fee_last_ewma
                    .almost_eq(this_ewma, 1u128)
                    .unwrap(),
                "this_ewma actual: {} expected: {}",
                fee_result.vol_adj_fee_last_ewma.to_string(),
                this_ewma.to_string()
            );

            // test fee_amount
            assert!(
                fee_result.fee_amount.almost_eq(fee_amount, 1u128).unwrap(),
                "fee_amount actual: {} expected: {}",
                fee_result.fee_amount.to_string(),
                fee_amount.to_string()
            );

            // test amount_ex_fee
            assert!(
                fee_result
                    .amount_ex_fee
                    .almost_eq(amount_ex_fee, 1u128)
                    .unwrap(),
                "amount_ex_fee actual: {} expected: {}",
                fee_result.amount_ex_fee.to_string(),
                amount_ex_fee.to_string()
            );

            // test fee_percentage
            assert!(
                fee_result
                    .fee_percentage
                    .almost_eq(fee_percentage, 1u128)
                    .unwrap(),
                "fee_percentage actual: {} expected: {}",
                fee_result.fee_percentage.to_string(),
                fee_percentage.to_string()
            );
        }
    }
}
