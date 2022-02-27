use anchor_lang::prelude::*;
use ndarray::{arr2, Array2};
use std::convert::TryInto;

pub const AMOUNT_SCALE: u8 = 8;

#[error]
pub enum ErrorCode {
    #[msg("Scale is different")]
    DifferentScale = 1,
    #[msg("Exceeds allowable range for value")]
    ExceedsRange = 2,
    #[msg("Exceeds allowable range for precision")]
    ExceedsPrecisionRange = 3,
}

#[derive(Clone, Copy, PartialEq, Debug)]
pub struct Decimal {
    pub value: u128,
    pub scale: u8,
}

impl Decimal {
    pub fn new(value: u128, scale: u8) -> Self {
        Self { value, scale }
    }

    pub fn from_u64(integer: u64) -> Self {
        Decimal {
            value: integer.into(),
            scale: 0,
        }
    }

    pub fn to_u64(self) -> u64 {
        self.value.try_into().unwrap()
    }

    pub fn from_amount(price: u128) -> Self {
        Decimal {
            value: price,
            scale: AMOUNT_SCALE,
        }
    }

    pub fn to_amount(self) -> Decimal {
        self.to_scale(AMOUNT_SCALE)
    }

    pub fn to_scale(self, scale: u8) -> Self {
        Self {
            value: if self.scale > scale {
                self.value
                    .checked_div(10u128.pow((self.scale - scale).into()))
                    .expect("scaled_down")
            } else {
                self.value
                    .checked_mul(10u128.pow((scale - self.scale).into()))
                    .expect("scaled_up")
            },
            scale,
        }
    }

    pub fn to_scale_up(self, scale: u8) -> Self {
        let decimal = Self::new(self.value, scale);
        if self.scale >= scale {
            decimal.div_up(Self::new(
                10u128.pow((self.scale - scale).try_into().unwrap()),
                0,
            ))
        } else {
            decimal.mul_up(Self::new(
                10u128.pow((scale - self.scale).try_into().unwrap()),
                0,
            ))
        }
    }

    pub fn denominator(self) -> u128 {
        10u128.pow(self.scale.into())
    }

    pub fn signed_add(
        lhs: &Decimal,
        lhs_signed: bool,
        rhs: &Decimal,
        rhs_signed: bool,
    ) -> (Self, bool) {
        if lhs_signed && rhs_signed {
            (lhs.add(*rhs).expect("double_negative"), true)
        } else if lhs_signed && !rhs_signed {
            rhs.sub_unsigned(*lhs).unwrap()
        } else if !lhs_signed && !rhs_signed {
            (lhs.add(*rhs).expect("double positive"), false)
        } else {
            lhs.sub_unsigned(*rhs).unwrap()
        }
    }

    pub fn signed_mul(
        lhs: &Decimal,
        lhs_signed: bool,
        rhs: &Decimal,
        rhs_signed: bool,
    ) -> (Decimal, bool) {
        let result = lhs.mul(*rhs);
        let result_signed = !(lhs_signed == rhs_signed);
        (result, result_signed)
    }
}

impl Mul<Decimal> for Decimal {
    fn mul(self, rhs: Decimal) -> Self {
        Self {
            value: self
                .value
                .checked_mul(rhs.value)
                .expect("checked_mul")
                .checked_div(rhs.denominator())
                .expect("checked_div"),
            scale: self.scale,
        }
    }
}

impl Mul<u128> for Decimal {
    fn mul(self, rhs: u128) -> Self {
        Self {
            value: self.value.checked_mul(rhs).expect("checked_mul"),
            scale: self.scale,
        }
    }
}

impl MulUp<Decimal> for Decimal {
    fn mul_up(self, rhs: Decimal) -> Self {
        let denominator = rhs.denominator();

        Self {
            value: self
                .value
                .checked_mul(rhs.value)
                .expect("checked_mul")
                .checked_add(denominator.checked_sub(1).unwrap())
                .expect("checked_add")
                .checked_div(denominator)
                .expect("checked_div"),
            scale: self.scale,
        }
    }
}

impl Add<Decimal> for Decimal {
    fn add(self, rhs: Decimal) -> Result<Self> {
        if !(self.scale == rhs.scale) {
            return Err(ErrorCode::DifferentScale.into());
        } else {
            Ok(Self {
                value: self.value.checked_add(rhs.value).expect("checked_add"),
                scale: self.scale,
            })
        }
    }
}

impl Sub<Decimal> for Decimal {
    fn sub(self, rhs: Decimal) -> Result<Self> {
        if !(self.scale == rhs.scale) {
            return Err(ErrorCode::DifferentScale.into());
        } else {
            Ok(Self {
                value: self.value.checked_sub(rhs.value).expect("checked_sub"),
                scale: self.scale,
            })
        }
    }
}

impl SubUnsigned<Decimal> for Decimal {
    /// Performs a subtraction, returning the result and whether the result is negative
    fn sub_unsigned(self, rhs: Decimal) -> Result<(Self, bool)> {
        if rhs.gt(self).unwrap() {
            // result is negative
            Ok((
                Self {
                    value: rhs.value.checked_sub(self.value).expect("checked_sub"),
                    scale: self.scale,
                },
                true,
            ))
        } else {
            Ok((
                Self {
                    value: self.value.checked_sub(rhs.value).expect("checked_sub"),
                    scale: self.scale,
                },
                false,
            ))
        }
    }
}

impl Div<Decimal> for Decimal {
    fn div(self, rhs: Decimal) -> Self {
        Self {
            value: self
                .value
                .checked_mul(rhs.denominator())
                .expect("checked_mul")
                .checked_div(rhs.value)
                .expect("checked_div"),
            scale: self.scale,
        }
    }
}

impl DivUp<Decimal> for Decimal {
    fn div_up(self, rhs: Decimal) -> Self {
        Self {
            value: self
                .value
                .checked_mul(rhs.denominator())
                .expect("checked_mul")
                .checked_add(rhs.value.checked_sub(1).unwrap())
                .expect("checked_add")
                .checked_div(rhs.value)
                .unwrap(),
            scale: self.scale,
        }
    }
}

impl DivScale<Decimal> for Decimal {
    fn div_to_scale(self, rhs: Decimal, to_scale: u8) -> Self {
        let decimal_difference = (self.scale as i32)
            .checked_sub(to_scale.into())
            .expect("checked_sub")
            .checked_sub(rhs.scale.into())
            .expect("checked_sub");

        let value = if decimal_difference > 0 {
            self.value
                .checked_div(rhs.value)
                .expect("checked_div")
                .checked_div(10u128.pow(decimal_difference.try_into().unwrap()))
                .expect("checked_div")
        } else {
            self.value
                .checked_mul(10u128.pow((-decimal_difference).try_into().unwrap()))
                .expect("checked_mul")
                .checked_div(rhs.value)
                .expect("checked_div")
        };

        Self {
            value,
            scale: to_scale,
        }
    }
}

impl Pow<u128> for Decimal {
    fn pow(self, exp: u128) -> Self {
        // This function has been copied from SPL math checked_pow
        // For odd powers, start with a multiplication by base since we halve the
        // exponent at the start
        let value = if exp.checked_rem(2).unwrap() == 0 {
            self.denominator()
        } else {
            self.value
        };

        let mut result = Decimal {
            value,
            scale: self.scale,
        };

        // To minimize the number of operations, we keep squaring the base, and
        // only push to the result on odd exponents, like a binary decomposition
        // of the exponent.
        let mut squared_base = self.clone();
        let mut current_exponent = exp.checked_div(2).unwrap();
        while current_exponent != 0 {
            squared_base = squared_base.mul(squared_base);

            // For odd exponents, "push" the base onto the value
            if current_exponent.checked_rem(2).unwrap() != 0 {
                result = result.mul(squared_base);
            }

            current_exponent = current_exponent.checked_div(2).unwrap();
        }
        return result;
    }
}

impl Pow<Decimal> for Decimal {
    fn pow(self, exp: Decimal) -> Self {
        // 0.25 to scale
        let divisor = Decimal::from_u64(1)
            .to_scale(self.scale)
            .div(Decimal::from_u64(4).to_scale(self.scale));

        let quotient = exp.div(divisor).to_scale(0).value as i32;

        // index of exponent/0.25
        match quotient {
            0 => {
                // x^0 = 1
                Decimal::new(1, self.scale)
            }
            1 => {
                // x^1/4 = x^0.25 = ⁴√x = √(√x) = sqrt(sqrt(x))
                self.sqrt().unwrap().sqrt().unwrap()
            }
            2 => {
                // x^1/2 = x^0.5 = √x = sqrt(x)
                self.sqrt().unwrap()
            }
            4 => {
                // x^1 = x
                self.clone()
            }
            5 => {
                // x^5/4 = x^1.25 = x(√(√x)) = x(sqrt(sqrt(x)))
                self.mul(self.sqrt().unwrap().sqrt().unwrap())
            }
            6 => {
                // x^3/2 = x^1.50 = x(√x) = x(sqrt(x))
                self.mul(self.sqrt().unwrap())
            }
            8 => {
                // x^2 = 2x
                self.mul(self)
            }
            _ => {
                assert!(
                    false,
                    "compute_pow not implemented for base: {} exponent: {}",
                    self.value, exp.value
                );
                Decimal::new(0, 0)
            }
        }
    }
}

impl PowAccuracy<u128> for Decimal {
    fn pow_with_accuracy(self, exp: u128) -> Self {
        let one = Decimal {
            value: self.denominator(),
            scale: self.scale,
        };

        if exp == 0 {
            return one;
        }

        let mut current_exp = exp;
        let mut base = self;
        let mut result = one;

        while current_exp > 0 {
            if current_exp % 2 != 0 {
                result = result.mul(base);
            }
            current_exp /= 2;
            base = base.mul(base);
        }
        return result;
    }
}

impl Into<u64> for Decimal {
    fn into(self) -> u64 {
        self.value.try_into().unwrap()
    }
}

impl Into<u128> for Decimal {
    fn into(self) -> u128 {
        self.value.try_into().unwrap()
    }
}

impl Compare<Decimal> for Decimal {
    fn eq(self, other: Decimal) -> Result<bool> {
        if !(self.scale == other.scale) {
            return Err(ErrorCode::DifferentScale.into());
        } else {
            Ok(self.value == other.value)
        }
    }

    fn lt(self, other: Decimal) -> Result<bool> {
        if !(self.scale == other.scale) {
            return Err(ErrorCode::DifferentScale.into());
        } else {
            Ok(self.value < other.value)
        }
    }

    fn gt(self, other: Decimal) -> Result<bool> {
        if !(self.scale == other.scale) {
            return Err(ErrorCode::DifferentScale.into());
        } else {
            Ok(self.value > other.value)
        }
    }

    fn gte(self, other: Decimal) -> Result<bool> {
        if !(self.scale == other.scale) {
            return Err(ErrorCode::DifferentScale.into());
        } else {
            Ok(self.value >= other.value)
        }
    }

    fn lte(self, other: Decimal) -> Result<bool> {
        if !(self.scale == other.scale) {
            return Err(ErrorCode::DifferentScale.into());
        } else {
            Ok(self.value <= other.value)
        }
    }
}

fn log_table(row: usize, col: usize) -> u128 {
    let table: Array2<u128> = arr2(&[
        [
            95310179804,
            9950330853,
            999500333,
            99995000,
            9999950,
            999999,
            99999,
            9999,
            1000,
            100,
            10,
            1,
        ],
        [
            182321556793,
            19802627296,
            1998002662,
            199980002,
            19999800,
            1999998,
            199999,
            19999,
            1999,
            200,
            20,
            1,
        ],
        [
            262364264467,
            29558802241,
            2995508979,
            299955008,
            29999550,
            2999995,
            299999,
            29999,
            3000,
            300,
            30,
            3,
        ],
        [
            336472236621,
            39220713153,
            3992021269,
            399920021,
            39999200,
            3999991,
            399999,
            39999,
            4000,
            400,
            40,
            3,
        ],
        [
            405465108108,
            48790164169,
            4987541511,
            499875041,
            49998750,
            4999987,
            499999,
            49999,
            4999,
            500,
            50,
            5,
        ],
        [
            470003629245,
            58268908123,
            5982071677,
            599820071,
            59998200,
            5999982,
            599999,
            59999,
            6000,
            600,
            60,
            6,
        ],
        [
            530628251062,
            67658648473,
            6975613736,
            699755114,
            69997550,
            6999975,
            699999,
            69999,
            6999,
            700,
            70,
            6,
        ],
        [
            587786664902,
            76961041136,
            7968169649,
            799680170,
            79996800,
            7999968,
            799999,
            79999,
            7999,
            800,
            80,
            8,
        ],
        [
            641853886172,
            86177696241,
            8959741371,
            899595242,
            89995950,
            8999959,
            899999,
            89999,
            9000,
            900,
            90,
            8,
        ],
    ]);

    table[[row, col]]
}

fn log_table_value(
    s_value: Decimal,
    t_value: Decimal,
    log_table_col: usize,
    scale: u8,
) -> (Decimal, Decimal, u128) {
    let s_value = s_value.div(t_value);
    let place_value = 10u128.checked_pow((log_table_col + 1) as u32).unwrap();
    let f_value = Decimal::new(place_value, scale);
    let t_value = s_value.mul(f_value).div(f_value);

    let log_table_row = t_value.mul(f_value).sub(f_value).unwrap();

    let mut lx_value = 0u128;

    if log_table_row.gt(Decimal::new(0u128, scale)).unwrap() {
        lx_value = log_table(log_table_row.to_u64() as usize - 1, log_table_col);
    }

    (s_value, t_value, lx_value)
}

impl Ln<Decimal> for Decimal {
    fn ln(self) -> Result<Self> {
        let scale = self.scale;
        let value_bit_length = (128u32 - (self.to_scale(0).to_u64() as u128).leading_zeros())
            .checked_sub(1)
            .unwrap() as u128;
        let max = Decimal::from_u64((1u128 << value_bit_length) as u64).to_scale(scale);

        let (s_0, t_0, lx_0) = log_table_value(self, max, 0, scale);
        let (s_1, t_1, lx_1) = log_table_value(s_0, t_0, 1, scale);
        let (s_2, t_2, lx_2) = log_table_value(s_1, t_1, 2, scale);
        let (s_3, t_3, lx_3) = log_table_value(s_2, t_2, 3, scale);
        let (s_4, t_4, lx_4) = log_table_value(s_3, t_3, 4, scale);
        let (s_5, t_5, lx_5) = log_table_value(s_4, t_4, 5, scale);
        let (s_6, t_6, lx_6) = log_table_value(s_5, t_5, 6, scale);
        let (s_7, t_7, lx_7) = log_table_value(s_6, t_6, 7, scale);
        let (s_8, t_8, lx_8) = log_table_value(s_7, t_7, 8, scale);
        let (_s_9, _t_9, lx_9) = log_table_value(s_8, t_8, 9, scale);

        let ln_2 = Decimal {
            value: 693147180559u128,
            scale,
        };

        let lx_sum = lx_0 + lx_1 + lx_2 + lx_3 + lx_4 + lx_5 + lx_6 + lx_7 + lx_8 + lx_9;

        let ln_decimal = Decimal {
            value: lx_sum,
            scale,
        };

        Ok(ln_2
            .mul(Decimal::from_u64(value_bit_length as u64))
            .add(ln_decimal)
            .unwrap())
    }
}

impl Sqrt<Decimal> for Decimal {
    fn sqrt(self) -> Result<Self> {
        let zero = Decimal::new(0, self.scale);
        let one = Decimal::from_u64(1).to_scale(self.scale);
        let max = Decimal::from_u64(std::u64::MAX).to_scale(self.scale);

        if self.lt(zero).unwrap() || self.gt(max).unwrap() {
            return Err(ErrorCode::ExceedsRange.into());
        }

        if self.eq(zero).unwrap() || self.eq(one).unwrap() {
            return Ok(self.clone());
        }

        let value = self.value;
        let value_scaled = match value.checked_mul(self.denominator()) {
            Some(x) => x,
            None => return Err(ErrorCode::ExceedsPrecisionRange.into()),
        };
        let value_scaled_bit_length = 128u32
            .checked_sub(value_scaled.leading_zeros())
            .expect("bit_length");
        let value_scaled_mid_length = value_scaled_bit_length
            .checked_div(2)
            .expect("value_scaled_mid_length");
        let value_approx = 2u128
            .checked_pow(value_scaled_mid_length)
            .expect("value_approx");
        let mut y = value_scaled.checked_div(value_approx).expect("y");
        let mut y_0 = 0u128;
        let threshold = 1u128;

        loop {
            if y.gt(&y_0) && (y.checked_sub(y_0).unwrap()).gt(&threshold) {
                let tmp_y = value_scaled.checked_div(y).unwrap();
                y_0 = y;
                y = y.checked_add(tmp_y).unwrap();
                y = y >> 1;
            } else if y.lt(&y_0) && (y_0.checked_sub(y).unwrap()).gt(&threshold) {
                let tmp_y = value_scaled.checked_div(y).unwrap();
                y_0 = y;
                y = y.checked_add(tmp_y).unwrap();
                y = y >> 1;
            } else {
                break;
            }
        }

        Ok(Self {
            value: y,
            scale: self.scale,
        })
    }
}

pub trait Sub<T>: Sized {
    fn sub(self, rhs: T) -> Result<Self>;
}

pub trait SubUnsigned<T>: Sized {
    fn sub_unsigned(self, rhs: T) -> Result<(Self, bool)>;
}

pub trait Add<T>: Sized {
    fn add(self, rhs: T) -> Result<Self>;
}

pub trait Div<T>: Sized {
    fn div(self, rhs: T) -> Self;
}

pub trait DivScale<T> {
    fn div_to_scale(self, rhs: T, to_scale: u8) -> Self;
}

pub trait DivUp<T>: Sized {
    fn div_up(self, rhs: T) -> Self;
}

pub trait Mul<T>: Sized {
    fn mul(self, rhs: T) -> Self;
}

pub trait MulUp<T>: Sized {
    fn mul_up(self, rhs: T) -> Self;
}

pub trait Ln<T>: Sized {
    fn ln(self) -> Result<Self>;
}

pub trait Pow<T>: Sized {
    fn pow(self, rhs: T) -> Self;
}

pub trait PowAccuracy<T>: Sized {
    fn pow_with_accuracy(self, rhs: T) -> Self;
}

pub trait Sqrt<T>: Sized {
    fn sqrt(self) -> Result<Self>;
}

pub trait Compare<T>: Sized {
    fn eq(self, rhs: T) -> Result<bool>;
    fn lt(self, rhs: T) -> Result<bool>;
    fn gt(self, rhs: T) -> Result<bool>;
    fn gte(self, rhs: T) -> Result<bool>;
    fn lte(self, rhs: T) -> Result<bool>;
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_basic_examples() {
        {
            // 3/2 = 1.500000
            let a = Decimal::from_u64(3).to_scale(6);
            let b = Decimal::from_u64(2).to_scale(6);

            let actual = a.div(b);
            let expected = Decimal {
                value: 1_500000,
                scale: 6,
            };

            assert_eq!({ actual.value }, { expected.value });
            assert_eq!(actual.scale, expected.scale);

            // 2/3 = 0.666667 rounded up
            let a = Decimal::from_u64(2).to_scale(6);
            let b = Decimal::from_u64(3).to_scale(6);

            let actual = a.div_up(b);
            let expected = Decimal {
                value: 666667,
                scale: 6,
            };

            assert_eq!({ actual.value }, { expected.value });
            assert_eq!(actual.scale, expected.scale);

            // 2/3 = 0.666666 truncated (default)
            let a = Decimal::from_u64(2).to_scale(6);
            let b = Decimal::from_u64(3).to_scale(6);

            let actual = a.div(b);
            let expected = Decimal {
                value: 666666,
                scale: 6,
            };

            assert_eq!({ actual.value }, { expected.value });
            assert_eq!(actual.scale, expected.scale);
        }
    }

    #[test]
    fn test_advanced_examples() {
        // power function with decimal exponent, scaled down (floor) at lower precision
        // 42^1.5 = 272.191109
        let base = Decimal::new(42_000000000000, 12);
        let exp = Decimal::new(1500000000000, 12);
        let result = base.pow(exp).to_scale(6);
        let expected = Decimal {
            value: 272_191109,
            scale: 6,
        };
        assert_eq!(result, expected);

        // power function with decimal exponent, scaled up (ceiling) at lower precision
        // 42^1.5 = 272.191110
        let base = Decimal::new(42_000000000000, 12);
        let exp = Decimal::new(1500000000000, 12);
        let result = base.pow(exp).to_scale_up(6);
        let expected = Decimal {
            value: 272_191110,
            scale: 6,
        };
        assert_eq!(result, expected);

        // square root of 2 with accuracy scaled to 12 decimal places
        let n = Decimal::from_u64(2).to_scale(12);
        let result = n.sqrt().unwrap();
        let expected = Decimal::new(1_414_213_562_373u128, 12);
        assert_eq!(result, expected);

        // square root of 2 with accuracy scaled to 8 decimal places
        let n = Decimal::from_u64(2).to_scale(8);
        let result = n.sqrt().unwrap();
        let expected = Decimal::new(1_414_213_56_u128, 8);
        assert_eq!(result, expected);

        // square root of 2 with accuracy scaled to 6 decimal places
        // with last digit rounded up
        let n = Decimal::from_u64(2).to_scale(8);
        let result = n.sqrt().unwrap().to_scale_up(6);
        let expected = Decimal::new(1_414_214u128, 6);
        assert_eq!(result, expected);
    }

    #[test]
    fn test_new() {
        {
            let value = 42;
            let scale = 3;
            let actual = Decimal::new(value, scale);
            let expected = Decimal { value, scale };

            assert_eq!({ actual.value }, { expected.value });
            assert_eq!(actual.scale, expected.scale);
        }
    }

    #[test]
    fn test_denominator() {
        {
            let decimal = Decimal::new(42, 2);
            let actual = decimal.denominator();
            let expected = 10u128.pow(2);
            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(42, 0);
            let actual = decimal.denominator();
            let expected = 1;
            assert_eq!(actual, expected);
        }
    }

    #[test]
    fn test_from_integer() {
        let integer: u64 = 42;
        let actual = Decimal::from_u64(integer);
        let expected = Decimal {
            value: 42,
            scale: 0,
        };

        assert_eq!({ actual.value }, { expected.value });
        assert_eq!(actual.scale, expected.scale);
    }

    #[test]
    fn test_from_amount() {
        let price: u128 = 42;
        let actual = Decimal::from_amount(price);
        let expected = Decimal {
            value: 42,
            scale: 8,
        };

        assert_eq!({ actual.value }, { expected.value });
        assert_eq!(actual.scale, expected.scale);
    }

    #[test]
    fn test_to_amount() {
        // greater than AMOUNT_SCALE
        {
            {
                let decimal = Decimal::new(4242, 10);
                let actual = decimal.to_amount();
                let expected = Decimal::new(42, 8);

                assert_eq!({ actual.value }, { expected.value });
                assert_eq!(actual.scale, expected.scale);
            }

            {
                let decimal = Decimal::new(4242, 13);
                let actual = decimal.to_amount();
                let expected = Decimal::new(0, 8);

                assert_eq!({ actual.value }, { expected.value });
                assert_eq!(actual.scale, expected.scale);
            }
        }

        // equal to AMOUNT_SCALE
        {
            let decimal = Decimal::new(4242, 8);
            let actual = decimal.to_amount();
            let expected = Decimal::new(4242, 8);

            assert_eq!({ actual.value }, { expected.value });
            assert_eq!(actual.scale, expected.scale);
        }

        // less than AMOUNT_SCALE
        {
            let decimal = Decimal::new(4242, 6);
            let actual = decimal.to_amount();
            let expected = Decimal::new(424200, 8);

            assert_eq!({ actual.value }, { expected.value });
            assert_eq!(actual.scale, expected.scale);
        }
    }

    #[test]
    fn test_to_u64() {
        let decimal = Decimal::new(69420, 6);
        let actual = decimal.to_u64();
        let expected: u64 = 69420;

        assert_eq!(actual, expected);
    }

    #[test]
    fn test_to_scale() {
        // increase precision
        {
            let decimal = Decimal::new(42, 2);
            let result = decimal.to_scale(3);

            assert_eq!(result.scale, 3);
            assert_eq!({ result.value }, 420);
        }
        // decrease precision
        {
            let decimal = Decimal::new(42, 2);
            let result = decimal.to_scale(1);

            assert_eq!(result.scale, 1);
            assert_eq!({ result.value }, 4);
        }
        // decrease precision past value
        {
            let decimal = Decimal::new(123, 4);
            let result = decimal.to_scale(0);

            assert_eq!(result.scale, 0);
            assert_eq!({ result.value }, 0);
        }
    }

    #[test]
    fn test_to_scale_up() {
        // increase precision
        {
            let decimal = Decimal::new(42, 2);
            let result = decimal.to_scale_up(3);

            assert_eq!(result.scale, 3);
            assert_eq!({ result.value }, 420);
        }
        // decrease precision
        {
            let decimal = Decimal::new(42, 2);
            let result = decimal.to_scale_up(1);

            assert_eq!(result.scale, 1);
            assert_eq!({ result.value }, 5);
        }
        // decrease precision past value
        {
            let decimal = Decimal::new(123, 4);
            let result = decimal.to_scale_up(0);

            assert_eq!(result.scale, 0);
            assert_eq!({ result.value }, 1);
        }
    }

    #[test]
    fn test_mul_decimal() {
        let decimal = Decimal::new(1234, 3);
        let multiply_by = Decimal::new(4321, 5);
        let actual = decimal.mul(multiply_by);
        let expected = Decimal::new(53, 3);

        assert_eq!({ actual.value }, { expected.value });
        assert_eq!(actual.scale, expected.scale);
    }

    #[test]
    #[should_panic]
    fn test_mul_decimal_panic() {
        let decimal = Decimal::new(u128::MAX - 1, 3);
        let multiply_by = Decimal::new(2, 3);
        decimal.mul(multiply_by);
    }

    #[test]
    fn test_mul_u128() {
        {
            let decimal = Decimal::new(9876, 2);
            let multiply_by: u128 = 555;
            let actual = decimal.mul(multiply_by);
            let expected = Decimal::new(5481180, 2);

            assert_eq!({ actual.value }, { expected.value });
            assert_eq!(actual.scale, expected.scale);
        }
    }

    #[test]
    #[should_panic]
    fn test_mul_u128_panic() {
        let decimal = Decimal::new(u128::MAX - 1, 2);
        let multiply_by = 2;
        decimal.mul(multiply_by);
    }

    #[test]
    fn test_add() {
        {
            let decimal = Decimal::new(1337, 6);
            let increase_by = Decimal::new(555, 2);
            let actual = decimal.add(increase_by);

            assert!(actual.is_err());
        }

        {
            let decimal = Decimal::new(1337, 6);
            let increase_by = Decimal::new(555, 6);
            let actual = decimal.add(increase_by).unwrap();
            let expected = Decimal::new(1892, 6);

            assert_eq!({ actual.value }, { expected.value });
        }
    }

    #[test]
    #[should_panic(expected = "checked_add")]
    fn test_add_panic() {
        let decimal = Decimal::new(u128::MAX - 1, 2);
        let increase_by = Decimal::new(2, 2);
        assert!(decimal.add(increase_by).is_err());
    }

    #[test]
    fn test_sub() {
        {
            let decimal = Decimal::new(1337, 6);
            let decrease_by = Decimal::new(555, 2);
            let actual = decimal.sub(decrease_by);

            assert!(actual.is_err());
        }

        {
            let decimal = Decimal::new(1337, 6);
            let decrease_by = Decimal::new(555, 6);
            let actual = decimal.sub(decrease_by).unwrap();
            let expected = Decimal::new(782, 6);

            assert_eq!({ actual.value }, { expected.value });
        }
    }

    #[test]
    #[should_panic(expected = "checked_sub")]
    fn test_sub_panic() {
        let decimal = Decimal::new(1, 1);
        let decrease_by = Decimal::new(2, 1);
        assert!(decimal.sub(decrease_by).is_err());
    }

    #[test]
    fn test_sub_unsigned() {
        {
            let decimal = Decimal::new(10, 6);
            let decrease_by = Decimal::new(30, 6);
            let expected = Decimal::new(20, 6);
            let expected_negative = true;
            let (actual, negative) = decimal.sub_unsigned(decrease_by).unwrap();

            assert_eq!(actual, expected);
            assert_eq!(negative, expected_negative);
        }
    }

    #[test]
    fn test_div() {
        {
            let decimal = Decimal::new(20, 8);
            let divide_by = Decimal::new(2, 3);
            let actual = decimal.div(divide_by);
            let expected = Decimal::new(10000, 8);

            assert_eq!({ actual.value }, { expected.value });
        }

        {
            let decimal = Decimal::new(20, 8);
            let divide_by = Decimal::new(3, 3);
            let actual = decimal.div(divide_by);
            let expected = Decimal::new(6666, 8);

            assert_eq!({ actual.value }, { expected.value });
        }
    }

    #[test]
    #[should_panic(expected = "checked_div")]
    fn test_div_panic() {
        let decimal = Decimal::new(10, 3);
        let divide_by = Decimal::new(0, 1);
        decimal.div(divide_by);
    }

    #[test]
    fn test_into_u64() {
        {
            let decimal = Decimal::new(333333333333333, 15);
            let actual: u64 = decimal.into();
            let expected: u64 = 333333333333333;

            assert_eq!(actual, expected);
        }
    }

    #[test]
    #[should_panic]
    #[allow(unused_variables)]
    fn test_into_u64_panic() {
        let decimal = Decimal::new(u128::MAX - 1, 15);
        let result: u64 = decimal.into();
    }

    #[test]
    fn test_into_u128() {
        {
            let decimal = Decimal::new(111000111, 10);
            let actual: u128 = decimal.into();
            let expected: u128 = 111000111;

            assert_eq!(actual, expected);
        }
    }

    #[test]
    fn test_lte() {
        {
            let decimal = Decimal::new(1001, 4);
            let other = Decimal::new(33, 2);
            let result = decimal.lte(other);

            assert!(result.is_err());
        }

        {
            let decimal = Decimal::new(1001, 4);
            let other = Decimal::new(33, 4);
            let actual = decimal.lte(other).unwrap();
            let expected = false;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(33, 4);
            let other = Decimal::new(33, 4);
            let actual = decimal.lte(other).unwrap();
            let expected = true;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(10, 4);
            let other = Decimal::new(33, 4);
            let actual = decimal.lte(other).unwrap();
            let expected = true;

            assert_eq!(actual, expected);
        }
    }

    #[test]
    fn test_lt() {
        {
            let decimal = Decimal::new(1001, 4);
            let other = Decimal::new(33, 2);
            let result = decimal.lt(other);

            assert!(result.is_err());
        }

        {
            let decimal = Decimal::new(1001, 4);
            let other = Decimal::new(33, 4);
            let actual = decimal.lt(other).unwrap();
            let expected = false;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(33, 4);
            let other = Decimal::new(33, 4);
            let actual = decimal.lt(other).unwrap();
            let expected = false;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(10, 4);
            let other = Decimal::new(33, 4);
            let actual = decimal.lt(other).unwrap();
            let expected = true;

            assert_eq!(actual, expected);
        }
    }

    #[test]
    fn test_gt() {
        {
            let decimal = Decimal::new(1001, 4);
            let other = Decimal::new(33, 2);
            let result = decimal.gt(other);

            assert!(result.is_err());
        }

        {
            let decimal = Decimal::new(1001, 4);
            let other = Decimal::new(33, 4);
            let actual = decimal.gt(other).unwrap();
            let expected = true;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(33, 4);
            let other = Decimal::new(33, 4);
            let actual = decimal.gt(other).unwrap();
            let expected = false;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(10, 4);
            let other = Decimal::new(33, 4);
            let actual = decimal.gt(other).unwrap();
            let expected = false;

            assert_eq!(actual, expected);
        }
    }

    #[test]
    fn test_gte() {
        {
            let decimal = Decimal::new(1001, 4);
            let other = Decimal::new(33, 2);
            let result = decimal.gte(other);

            assert!(result.is_err());
        }

        {
            let decimal = Decimal::new(1001, 4);
            let other = Decimal::new(33, 4);
            let actual = decimal.gte(other).unwrap();
            let expected = true;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(33, 4);
            let other = Decimal::new(33, 4);
            let actual = decimal.gte(other).unwrap();
            let expected = true;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(10, 4);
            let other = Decimal::new(33, 4);
            let actual = decimal.gte(other).unwrap();
            let expected = false;

            assert_eq!(actual, expected);
        }
    }

    #[test]
    fn test_eq() {
        {
            let decimal = Decimal::new(1001, 4);
            let other = Decimal::new(33, 2);
            let result = decimal.eq(other);

            assert!(result.is_err());
        }

        {
            let decimal = Decimal::new(1001, 4);
            let other = Decimal::new(33, 4);
            let actual = decimal.eq(other).unwrap();
            let expected = false;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(33, 4);
            let other = Decimal::new(33, 4);
            let actual = decimal.eq(other).unwrap();
            let expected = true;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(10, 4);
            let other = Decimal::new(33, 4);
            let actual = decimal.eq(other).unwrap();
            let expected = false;

            assert_eq!(actual, expected);
        }
    }

    #[test]
    fn test_pow_with_integer_exp() {
        // 0**n = 0
        {
            let decimal: u8 = AMOUNT_SCALE;
            let base = Decimal::new(0, decimal);
            let exp: u128 = 100;
            let result = base.pow(exp);
            let expected = Decimal::new(0, decimal);
            assert_eq!(result, expected);
        }

        // n**0 = 1
        let decimal: u8 = AMOUNT_SCALE;
        let base = Decimal::from_u64(10).to_scale(decimal);
        let exp: u128 = 0;
        let result = base.pow(exp);
        let expected = Decimal::from_u64(1).to_scale(decimal);
        assert_eq!(result, expected);

        // 2**18 = 262,144
        {
            let decimal: u8 = AMOUNT_SCALE;
            let base = Decimal::from_u64(2).to_scale(decimal);
            let exp: u128 = 18;
            let result = base.pow(exp);
            let expected = Decimal::from_u64(262_144).to_scale(decimal);
            assert_eq!(result, expected);
        }

        // // 3.41200000**8 = 18368.43602322
        {
            let base = Decimal::from_amount(341200000);
            let exp: u128 = 8;
            let result = base.pow(exp);
            let expected = Decimal::from_amount(18368_43602280);
            assert_eq!(result, expected);
        }
    }

    #[test]
    fn test_pow_with_decimal_exp() {
        // 42^0 = 1
        let base = Decimal::new(42, 6);
        let exp = Decimal::new(0, 6);
        let result = base.pow(exp);
        let expected = Decimal::new(1, 6);
        assert_eq!(result, expected);

        // 42^0.25 = 2.545729895021831
        let base = Decimal::new(42_000000000000, 12);
        let exp = Decimal::new(250000000000, 12);
        let result = base.pow(exp);
        let expected = Decimal {
            value: 2_545_729_895_021u128,
            scale: 12,
        };
        assert_eq!(result, expected);

        // 42^0.5 = 6.48074069840786
        let base = Decimal::new(42_000000000000, 12);
        let exp = Decimal::new(500000000000, 12);
        let result = base.pow(exp);
        let expected = Decimal {
            value: 6_480_740_698_407u128,
            scale: 12,
        };
        assert_eq!(result, expected);

        // 42^1 = 42
        let base = Decimal::new(42_000000000000, 12);
        let exp = Decimal::new(1000000000000, 12);
        let result = base.pow(exp);
        let expected = Decimal {
            value: 42_000000000000u128,
            scale: 12,
        };
        assert_eq!(result, expected);

        // 42^1.25 = 106.920655590916882
        let base = Decimal::new(42_000000000000, 12);
        let exp = Decimal::new(1250000000000, 12);
        let result = base.pow(exp);
        let expected = Decimal {
            value: 106_920_655_590_882u128,
            scale: 12,
        };
        assert_eq!(result, expected);

        // 42^1.5 = 272.19110933313013
        let base = Decimal::new(42_000000000000, 12);
        let exp = Decimal::new(1500000000000, 12);
        let result = base.pow(exp);
        let expected = Decimal {
            value: 272_191_109_333_094,
            scale: 12,
        };
        assert_eq!(result, expected);

        // 42^2 = 1764
        let base = Decimal::new(42_000000000000, 12);
        let exp = Decimal::new(2000000000000, 12);
        let result = base.pow(exp);
        let expected = Decimal {
            value: 1764_000000000000u128,
            scale: 12,
        };
        assert_eq!(result, expected);
    }

    #[test]
    fn test_mul_up() {
        // mul of small number
        {
            let a = Decimal::new(1, 12);
            let b = Decimal::new(1, 12);
            assert_eq!(a.mul_up(b), Decimal::new(1, 12));
        }

        // mul same precision
        // 1.000000 * 0.300000 = 0.300000
        {
            let a = Decimal::new(1000000, 6);
            let b = Decimal::new(300000, 6);
            assert_eq!(a.mul_up(b), Decimal::new(300000, 6));
        }

        // mul by zero
        // 1.00 * 0 = 0.00
        {
            let a = Decimal::new(100, 2);
            let b = Decimal::new(0, 0);
            assert_eq!(a.mul_up(b), Decimal::new(0, 2));
        }

        // mul different decimals increases precision
        {
            let a = Decimal::new(1_000_000_000, 9);
            let b = Decimal::new(3, 6);
            assert_eq!(a.mul_up(b), Decimal::new(3000, 9));
        }
    }

    #[test]
    fn test_div_up() {
        // 0/n = 0
        {
            let a = Decimal::new(0, 0);
            let b = Decimal::new(1, 0);
            assert_eq!(a.div_up(b), Decimal::new(0, 0));
        }

        // 1/2 = 1 rounded up
        {
            let a = Decimal::new(1, 0);
            let b = Decimal::new(2, 0);
            assert_eq!(a.div_up(b), Decimal::new(1, 0));
        }

        // 200,000.000001/2 = 100000.000001 rounded up
        {
            let a = Decimal::new(200_000_000_001, 6);
            let b = Decimal::new(2_000, 3);
            assert!(!a.div_up(b).lt(Decimal::new(100_000_000_001, 6)).unwrap());
        }

        // 42.00/10 = 4.20 = 5.00 rounded up
        {
            let a = Decimal::new(42, 2);
            let b = Decimal::new(10, 0);
            assert_eq!(a.div_up(b), Decimal::new(5, 2));
        }
    }

    #[test]
    fn test_div_to_scale() {
        // nominator scale == denominator scale
        {
            let nominator = Decimal::new(20_000, 8);
            let denominator = Decimal::new(4, 8);

            // to_scale == scale
            let to_scale = 8;
            let result = nominator.div_to_scale(denominator, to_scale);
            let expected = Decimal::from_u64(5_000).to_scale(to_scale);
            assert_eq!(result, expected);

            // to_scale > scale
            let to_scale = 11;
            let result = nominator.div_to_scale(denominator, to_scale);
            let expected = Decimal::from_u64(5_000).to_scale(to_scale);
            assert_eq!(result, expected);

            // to_scale < scale
            let to_scale = 5;
            let result = nominator.div_to_scale(denominator, to_scale);
            let expected = Decimal::from_u64(5_000).to_scale(to_scale);
            assert_eq!(result, expected);
        }

        // nominator scale != denominator scale
        {
            let nominator = Decimal::new(35, 5);
            let denominator = Decimal::new(5, 1);

            // to_scale == nominator scale
            let to_scale = 7;
            let result = nominator.div_to_scale(denominator, to_scale);
            let expected = Decimal::new(7000, to_scale);
            assert_eq!(result, expected);

            // to_scale > nominator scale
            let to_scale = 9;
            let result = nominator.div_to_scale(denominator, to_scale);
            let expected = Decimal::new(700_000, to_scale);
            assert_eq!(result, expected);

            // to_scale < nominator scale
            let to_scale = 5;
            let result = nominator.div_to_scale(denominator, to_scale);
            let expected = Decimal::new(70, to_scale);
            assert_eq!(result, expected);
        }
    }

    #[test]
    fn test_sqrt() {
        // The square roots of the perfect squares (e.g., 0, 1, 4, 9, 16) are integers.
        // In all other cases, the square roots of positive integers are irrational numbers,
        // and hence have non-repeating decimals in their decimal representations.
        // Decimal approximations of the square roots of the first few natural numbers
        // are given in the following specs.

        // 0**0.5 = 0
        let n = Decimal::from_u64(0).to_scale(12);
        let result = n.sqrt().unwrap();
        let expected = Decimal::from_u64(0).to_scale(12);
        assert_eq!(result, expected);

        // 1**0.5 = 1
        let n = Decimal::from_u64(1).to_scale(12);
        let result = n.sqrt().unwrap();
        let expected = Decimal::from_u64(1).to_scale(12);
        assert_eq!(result, expected);

        // 2**0.5 = 1.414213562373
        let n = Decimal::from_u64(2).to_scale(12);
        let result = n.sqrt().unwrap();
        let expected = Decimal::new(1_414_213_562_373u128, 12);
        assert_eq!(result, expected);

        // 3**0.5 = 1.7320508076
        let n = Decimal::from_u64(3).to_scale(12);
        let result = n.sqrt().unwrap();
        let expected = Decimal::new(1_732_050_807_568u128, 12);
        assert_eq!(result, expected);

        // 4**0.5 = 2
        let n = Decimal::from_u64(4).to_scale(12);
        let result = n.sqrt().unwrap();
        let expected = Decimal::from_u64(2).to_scale(12);
        assert_eq!(result, expected);

        // MAX**0.5 = 4294967296
        let n = Decimal::from_u64(u64::MAX).to_scale(6);
        let result = n.sqrt().unwrap().to_scale_up(0).value;
        let expected = 4294967296u128;
        assert_eq!(result, expected);

        // 3.141592653589**0.5 = 1.7724538509
        let n = Decimal::new(3_141_592_653_589u128, 12);
        let result = n.sqrt().unwrap();
        let expected = Decimal::new(1_772_453_850_905u128, 12);
        assert_eq!(result, expected);

        // 3.141592**0.5 = 1.772453
        let n = Decimal::new(3_141_592u128, 6);
        let result = n.sqrt().unwrap();
        let expected = Decimal::new(1_772_453u128, 6);
        assert_eq!(result, expected);
    }

    #[test]
    fn test_natural_log() {
        {
            // ln(10) = 2.302585092987

            let expected = Decimal {
                value: 2_302585092924u128,
                scale: 12,
            };

            let n = Decimal::from_u64(10).to_scale(12);
            let actual = n.ln().unwrap();

            assert_eq!({ actual.value }, { expected.value });
            assert_eq!(actual.scale, expected.scale);
        }

        // MAX u64
        {
            // ln(18446744073709551615) = 44.36141956

            let expected = Decimal {
                value: 44_361419550245u128,
                scale: 9,
            };

            let n = Decimal::from_u64(u64::MAX).to_scale(9);
            let actual = n.ln().unwrap();

            assert_eq!({ actual.value }, { expected.value });
            assert_eq!(actual.scale, expected.scale);
        }
    }

    #[test]
    fn test_signed_add() {
        // -4 + -3 = -7
        let lhs = Decimal::new(4, 0);
        let lhs_signed = true;
        let rhs = Decimal::new(3, 0);
        let rhs_signed = true;
        let expected = Decimal::new(7, 0);
        let expected_signed = true;
        assert_eq!(
            Decimal::signed_add(&lhs, lhs_signed, &rhs, rhs_signed),
            (expected, expected_signed)
        );

        // -1 + 1 = 0
        let lhs = Decimal::new(1, 0);
        let lhs_signed = true;
        let rhs = Decimal::new(1, 0);
        let rhs_signed = false;
        let expected = Decimal::new(0, 0);
        let expected_signed = false;
        assert_eq!(
            Decimal::signed_add(&lhs, lhs_signed, &rhs, rhs_signed),
            (expected, expected_signed)
        );

        // 3 + -5 = -2
        let lhs = Decimal::new(3, 0);
        let lhs_signed = false;
        let rhs = Decimal::new(5, 0);
        let rhs_signed = true;
        let expected = Decimal::new(2, 0);
        let expected_signed = true;
        assert_eq!(
            Decimal::signed_add(&lhs, lhs_signed, &rhs, rhs_signed),
            (expected, expected_signed)
        );

        // -5 + 3 = -2
        let lhs = Decimal::new(5, 0);
        let lhs_signed = true;
        let rhs = Decimal::new(3, 0);
        let rhs_signed = false;
        let expected = Decimal::new(2, 0);
        let expected_signed = true;
        assert_eq!(
            Decimal::signed_add(&lhs, lhs_signed, &rhs, rhs_signed),
            (expected, expected_signed)
        );

        // 5 + -2 = 3
        let lhs = Decimal::new(5, 0);
        let lhs_signed = false;
        let rhs = Decimal::new(2, 0);
        let rhs_signed = true;
        let expected = Decimal::new(3, 0);
        let expected_signed = false;
        assert_eq!(
            Decimal::signed_add(&lhs, lhs_signed, &rhs, rhs_signed),
            (expected, expected_signed)
        );

        // -3 + 5 = 2
        let lhs = Decimal::new(3, 0);
        let lhs_signed = true;
        let rhs = Decimal::new(5, 0);
        let rhs_signed = false;
        let expected = Decimal::new(2, 0);
        let expected_signed = false;
        assert_eq!(
            Decimal::signed_add(&lhs, lhs_signed, &rhs, rhs_signed),
            (expected, expected_signed)
        );

        // 1 + -2 = -1
        let lhs = Decimal::new(1, 0);
        let lhs_signed = false;
        let rhs = Decimal::new(2, 0);
        let rhs_signed = true;
        let expected = Decimal::new(1, 0);
        let expected_signed = true;
        assert_eq!(
            Decimal::signed_add(&lhs, lhs_signed, &rhs, rhs_signed),
            (expected, expected_signed)
        );

        // 4 + 3 = 7
        let lhs = Decimal::new(4, 0);
        let lhs_signed = false;
        let rhs = Decimal::new(3, 0);
        let rhs_signed = false;
        let expected = Decimal::new(7, 0);
        let expected_signed = false;
        assert_eq!(
            Decimal::signed_add(&lhs, lhs_signed, &rhs, rhs_signed),
            (expected, expected_signed)
        );
    }

    #[test]
    fn test_signed_mul() {
        // -4 * -3 = 12
        let lhs = Decimal::new(4, 0);
        let lhs_signed = true;
        let rhs = Decimal::new(3, 0);
        let rhs_signed = true;
        let expected = Decimal::new(12, 0);
        let expected_signed = false;
        assert_eq!(
            Decimal::signed_mul(&lhs, lhs_signed, &rhs, rhs_signed),
            (expected, expected_signed)
        );

        // -4 * 3 = -12
        let lhs = Decimal::new(4, 0);
        let lhs_signed = true;
        let rhs = Decimal::new(3, 0);
        let rhs_signed = false;
        let expected = Decimal::new(12, 0);
        let expected_signed = true;
        assert_eq!(
            Decimal::signed_mul(&lhs, lhs_signed, &rhs, rhs_signed),
            (expected, expected_signed)
        );

        // 4 * -3 = -12
        let lhs = Decimal::new(4, 0);
        let lhs_signed = false;
        let rhs = Decimal::new(3, 0);
        let rhs_signed = true;
        let expected = Decimal::new(12, 0);
        let expected_signed = true;
        assert_eq!(
            Decimal::signed_mul(&lhs, lhs_signed, &rhs, rhs_signed),
            (expected, expected_signed)
        );

        // 4 * 3 = 12
        let lhs = Decimal::new(4, 0);
        let lhs_signed = false;
        let rhs = Decimal::new(3, 0);
        let rhs_signed = false;
        let expected = Decimal::new(12, 0);
        let expected_signed = false;
        assert_eq!(
            Decimal::signed_mul(&lhs, lhs_signed, &rhs, rhs_signed),
            (expected, expected_signed)
        );
    }
}
