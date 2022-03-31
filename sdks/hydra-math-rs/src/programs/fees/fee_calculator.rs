use crate::decimal::{Compare, Decimal, Mul, Sub};

/// Fee calculator input parameters
#[derive(Debug)]
pub struct FeeCalculator {
    percentage: Decimal,
}

impl FeeCalculator {
    /// Create a new [FeeCalculator] from its percentage as a [Decimal].
    pub fn new(percentage: Decimal) -> Self {
        Self { percentage }
    }
    /// compute fees amount and amount_ex_fee based on input and settings
    pub fn compute_fees(&self, input_amount: &Decimal) -> (Decimal, Decimal) {
        // default to zero if fee_rate numerator or denominator are 0
        let zero = Decimal::from_scaled_amount(0, input_amount.scale);

        if self.percentage.eq(zero).unwrap() {
            return (zero, *input_amount);
        }

        let scaled_percentage = self.percentage.to_scale(input_amount.scale);

        let fees = input_amount.mul(scaled_percentage);

        if fees.gte(*input_amount).unwrap() {
            //TODO: add some error handling for this if fees are gt input amount
        }

        let amount_ex_fees = input_amount.sub(fees).expect("amount_ex_fees");

        (fees, amount_ex_fees)
    }
}

impl Default for FeeCalculator {
    fn default() -> Self {
        Self {
            percentage: Default::default(),
        }
    }
}
