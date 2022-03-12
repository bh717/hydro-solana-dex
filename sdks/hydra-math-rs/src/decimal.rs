use ndarray::{arr2, Array2};
use std::convert::TryInto;
use thiserror::Error;

/// Default precision for a [Decimal] expressed as an amount.
pub const AMOUNT_SCALE: u8 = 8;
// TODO: add more constants for default precision on other types e.g. fees, percentages

/// Error codes related to [Decimal].
#[derive(Error, Debug)]
pub enum ErrorCode {
    #[error("Scale is different")]
    DifferentScale,
    #[error("Exceeds allowable range for value")]
    ExceedsRange,
    #[error("Exceeds allowable range for precision")]
    ExceedsPrecisionRange,
}

/// [Decimal] representation of a number with a value, scale (precision in terms of number of decimal places
/// and a negative boolean to handle signed arithmetic.
#[derive(Clone, Copy, PartialEq, Debug)]
pub struct Decimal {
    pub value: u128,
    pub scale: u8,
    pub negative: bool,
}

/// Defaults for [Decimal] assumes numbers are positive by default and no decimal places.
impl Default for Decimal {
    fn default() -> Self {
        Self {
            value: 0,
            scale: 0,
            negative: false,
        }
    }
}

impl Decimal {
    /// Create a new [Decimal] from its value, scale and negative parts.
    pub fn new(value: u128, scale: u8, negative: bool) -> Self {
        Self {
            value,
            scale,
            negative,
        }
    }

    /// Create a [Decimal] from an unsigned integer, assumed positive by default.
    pub fn from_u64(integer: u64) -> Self {
        Decimal {
            value: integer.into(),
            scale: 0,
            ..Decimal::default()
        }
    }

    /// Convert a [Decimal] to an unsigned integer, assumed positive by default.
    pub fn to_u64(self) -> u64 {
        self.value.try_into().unwrap()
    }

    /// Create a [Decimal] from an unsigned integer, assumed positive by default.
    pub fn from_u128(integer: u128) -> Self {
        Decimal {
            value: integer,
            scale: 0,
            ..Decimal::default()
        }
    }

    /// Convert a [Decimal] to an unsigned integer, assumed positive by default.
    pub fn to_u128(self) -> u128 {
        self.value
    }

    /// Create a [Decimal] from an unsigned integer expressed as an amount
    /// with precision defined by constant and assumed positive by default.
    pub fn from_amount(amount: u128) -> Self {
        Decimal {
            value: amount,
            scale: AMOUNT_SCALE,
            ..Decimal::default()
        }
    }

    /// Convert a [Decimal] to an unsigned integer expressed as an amount.
    pub fn to_amount(self) -> Decimal {
        self.to_scale(AMOUNT_SCALE)
    }

    /// Modify the scale (precision) of a [Decimal] to a different scale.
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
            negative: self.negative,
        }
    }

    /// Modify the scale (precision) of a [Decimal] to a different scale
    /// and round up (ceiling) the value.
    pub fn to_scale_up(self, scale: u8) -> Self {
        let decimal = Self::new(self.value, scale, self.negative);
        if self.scale >= scale {
            decimal.div_up(Self::new(
                10u128.pow((self.scale - scale).try_into().unwrap()),
                0,
                self.negative,
            ))
        } else {
            decimal.mul_up(Self::new(
                10u128.pow((scale - self.scale).try_into().unwrap()),
                0,
                self.negative,
            ))
        }
    }

    /// Show the scale of a [Decimal] expressed as a power of 10.
    pub fn denominator(self) -> u128 {
        10u128.pow(self.scale.into())
    }
}

/// Multiply another [Decimal] value against itself, including signed multiplication.
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
            negative: !(self.negative == rhs.negative),
        }
    }
}

/// Multiply an unsigned integer value against itself.
impl Mul<u128> for Decimal {
    fn mul(self, rhs: u128) -> Self {
        Self {
            value: self.value.checked_mul(rhs).expect("checked_mul"),
            scale: self.scale,
            negative: self.negative,
        }
    }
}

/// Multiply another [Decimal] value against itself, including signed multiplication
/// and round up (ceiling) the value.
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
            negative: !(self.negative == rhs.negative),
        }
    }
}

/// Add another [Decimal] value to itself, including signed addition.
impl Add<Decimal> for Decimal {
    fn add(self, rhs: Decimal) -> Result<Self, ErrorCode> {
        if !(self.scale == rhs.scale) {
            return Err(ErrorCode::DifferentScale.into());
        } else {
            if self.negative && rhs.negative {
                Ok(Self {
                    value: self.value.checked_add(rhs.value).expect("checked_add"),
                    scale: self.scale,
                    negative: true, // -a + -b = -(a + b)
                })
            } else if self.negative && !rhs.negative {
                rhs.sub(self) // -a + b = b - a
            } else if !self.negative && !rhs.negative {
                Ok(Self {
                    value: self.value.checked_add(rhs.value).expect("checked_add"),
                    scale: self.scale,
                    negative: false, // a + b = a + b
                })
            } else {
                self.sub(rhs) // a + -b = a - b
            }
        }
    }
}

/// Subtract another [Decimal] value from itself, including signed subtraction.
impl Sub<Decimal> for Decimal {
    fn sub(self, rhs: Decimal) -> Result<Self, ErrorCode> {
        if !(self.scale == rhs.scale) {
            return Err(ErrorCode::DifferentScale.into());
        } else {
            if rhs.gt(self).unwrap() {
                // result must be negative
                Ok(Self {
                    value: rhs.value.checked_sub(self.value).expect("checked_sub"),
                    scale: self.scale,
                    negative: true,
                })
            } else {
                // result can be negative depending on self
                Ok(Self {
                    value: self.value.checked_sub(rhs.value).expect("checked_sub"),
                    scale: self.scale,
                    negative: self.negative,
                })
            }
        }
    }
}

/// Divide a [Decimal] over another [Decimal], including signed division.
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
            negative: !(self.negative == rhs.negative),
        }
    }
}

/// Divide a [Decimal] over another [Decimal], including signed division.
/// and round up (ceiling) the value.
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
            negative: !(self.negative == rhs.negative),
        }
    }
}

/// Divide another [Decimal] value under itself, including signed division
/// and modify the scale (precision)
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
            negative: !(self.negative == rhs.negative),
        }
    }
}

/// Calculate the power of a [Decimal] with another [Decimal] as the exponent.
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
                Decimal::new(1, self.scale, self.negative)
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
                Decimal::new(0, 0, false)
            }
        }
    }
}

/// Calculate the power of a [Decimal] with an unsigned integer as the exponent.
impl Pow<u128> for Decimal {
    fn pow(self, exp: u128) -> Self {
        let one = Decimal {
            value: self.denominator(),
            scale: self.scale,
            negative: self.negative,
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

/// Convert a [Decimal] into an unsigned 64-bit integer.
impl Into<u64> for Decimal {
    fn into(self) -> u64 {
        self.value.try_into().unwrap()
    }
}

/// Convert a [Decimal] into an unsigned 128-bit integer.
impl Into<u128> for Decimal {
    fn into(self) -> u128 {
        self.value.try_into().unwrap()
    }
}

/// Compare two [Decimal] values/scale with comparison query operators.
impl Compare<Decimal> for Decimal {
    /// Show if two [Decimal] values equal each other
    fn eq(self, other: Decimal) -> Result<bool, ErrorCode> {
        if !(self.scale == other.scale) {
            return Err(ErrorCode::DifferentScale.into());
        } else {
            Ok(self.value == other.value)
        }
    }

    /// Show if one [Decimal] value is less than another.
    fn lt(self, other: Decimal) -> Result<bool, ErrorCode> {
        if !(self.scale == other.scale) {
            return Err(ErrorCode::DifferentScale.into());
        } else {
            Ok(self.value < other.value)
        }
    }

    /// Show if one [Decimal] value is greater than another.
    fn gt(self, other: Decimal) -> Result<bool, ErrorCode> {
        if !(self.scale == other.scale) {
            return Err(ErrorCode::DifferentScale.into());
        } else {
            Ok(self.value > other.value)
        }
    }

    /// Show if one [Decimal] value is greater than or equal to another.
    fn gte(self, other: Decimal) -> Result<bool, ErrorCode> {
        if !(self.scale == other.scale) {
            return Err(ErrorCode::DifferentScale.into());
        } else {
            Ok(self.value >= other.value)
        }
    }

    /// Show if one [Decimal] value is less than or equal to another.
    fn lte(self, other: Decimal) -> Result<bool, ErrorCode> {
        if !(self.scale == other.scale) {
            return Err(ErrorCode::DifferentScale.into());
        } else {
            Ok(self.value <= other.value)
        }
    }
}

/// Private function of pre calculated log table values.
/// These can be calculated from an index expressed as:
// 1.1	1.01	1.001	1.0001	1.00001	1.000001	1.0000001	1.00000001	1.000000001
// 1.2	1.02	1.002	1.0002	1.00002	1.000002	1.0000002	1.00000002	1.000000002
// 1.3	1.03	1.003	1.0003	1.00003	1.000003	1.0000003	1.00000003	1.000000003
// 1.4	1.04	1.004	1.0004	1.00004	1.000004	1.0000004	1.00000004	1.000000004
// 1.5	1.05	1.005	1.0005	1.00005	1.000005	1.0000005	1.00000005	1.000000005
// 1.6	1.06	1.006	1.0006	1.00006	1.000006	1.0000006	1.00000006	1.000000006
// 1.7	1.07	1.007	1.0007	1.00007	1.000007	1.0000007	1.00000007	1.000000007
// 1.8	1.08	1.008	1.0008	1.00008	1.000008	1.0000008	1.00000008	1.000000008
// 1.9	1.09	1.009	1.0009	1.00009	1.000009	1.0000009	1.00000009	1.000000009
// with each column, row determined by the function:
// INT(LN(index)*scale)
// where scale is a predetermined precision e.g. 10^12
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

/// Private function to return a pre calculated log table value based on scale, column
/// and s and t values.
fn log_table_value(
    s_value: Decimal,
    t_value: Decimal,
    log_table_col: usize,
    scale: u8,
) -> (Decimal, Decimal, u128) {
    let s_value = s_value.div(t_value);
    let place_value = 10u128.checked_pow((log_table_col + 1) as u32).unwrap();
    let f_value = Decimal::new(place_value, scale, false);
    let t_value = s_value.mul(f_value).div(f_value);

    let log_table_row: usize = t_value.mul(f_value).sub(f_value).unwrap().into();
    let log_table_row = log_table_row.checked_sub(1);

    let mut lx_value = 0u128;

    // Ensure within array of shape [9, 12]
    let log_table_row_range = 0..9;
    let log_table_col_range = 0..12;

    match log_table_row {
        Some(log_table_row) => {
            if log_table_row_range.contains(&log_table_row)
                && log_table_col_range.contains(&log_table_col)
            {
                lx_value = log_table(log_table_row, log_table_col);
            }
        }
        None => lx_value = 0,
    }

    (s_value, t_value, lx_value)
}

/// Calculate the natural logarithm of a [Decimal] value. For full algorithm please refer to:
// https://docs.google.com/spreadsheets/d/19mgYjGQlpsuaTk1zXujn-yCSdbAL25sP/edit?pli=1#gid=2070648638
impl Ln<Decimal> for Decimal {
    fn ln(self) -> Result<Self, ErrorCode> {
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
            negative: self.negative,
        };

        let lx_sum = lx_0 + lx_1 + lx_2 + lx_3 + lx_4 + lx_5 + lx_6 + lx_7 + lx_8 + lx_9;

        let ln_decimal = Decimal {
            value: lx_sum,
            scale,
            negative: self.negative,
        };

        Ok(ln_2
            .mul(Decimal::from_u64(value_bit_length as u64))
            .add(ln_decimal)
            .unwrap())
    }
}

/// Calculate the square root of a [Decimal] value. For full algorithm please refer to:
// https://docs.google.com/spreadsheets/d/1dw7HaR_YsgvT7iA_4kv2rgWb-EvSyQGM/edit#gid=432909162
impl Sqrt<Decimal> for Decimal {
    fn sqrt(self) -> Result<Self, ErrorCode> {
        let zero = Decimal::new(0, self.scale, false);
        let one = Decimal::from_u128(1).to_scale(self.scale);

        if self.value.lt(&0u128) || self.value.gt(&u128::MAX) {
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
            negative: self.negative,
        })
    }
}

pub trait Sub<T>: Sized {
    fn sub(self, rhs: T) -> Result<Self, ErrorCode>;
}

pub trait Add<T>: Sized {
    fn add(self, rhs: T) -> Result<Self, ErrorCode>;
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
    fn ln(self) -> Result<Self, ErrorCode>;
}

pub trait Pow<T>: Sized {
    fn pow(self, rhs: T) -> Self;
}

pub trait Sqrt<T>: Sized {
    fn sqrt(self) -> Result<Self, ErrorCode>;
}

pub trait Compare<T>: Sized {
    fn eq(self, rhs: T) -> Result<bool, ErrorCode>;
    fn lt(self, rhs: T) -> Result<bool, ErrorCode>;
    fn gt(self, rhs: T) -> Result<bool, ErrorCode>;
    fn gte(self, rhs: T) -> Result<bool, ErrorCode>;
    fn lte(self, rhs: T) -> Result<bool, ErrorCode>;
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
                negative: false,
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
                negative: false,
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
                negative: false,
            };

            assert_eq!({ actual.value }, { expected.value });
            assert_eq!(actual.scale, expected.scale);
        }
    }

    #[test]
    fn test_advanced_examples() {
        // large number multiplication
        let lhs = Decimal::from_u128(17134659154348278833);
        let rhs = Decimal::from_u128(11676758639919526015);
        let result = lhs.mul(rhs);
        let expected = Decimal::from_u128(200077279322612464128594731044417340495);
        assert_eq!(result, expected);

        let lhs = Decimal::from_u64(17134659154348278833);
        let rhs = Decimal::from_u64(11676758639919526015);
        let result = lhs.mul(rhs);
        let expected = Decimal::from_u128(200077279322612464128594731044417340495);
        assert_eq!(result, expected);

        let lhs = Decimal::from_amount(17134659154348278833);
        let rhs = Decimal::from_amount(11676758639919526015);
        let result = lhs.mul(rhs);
        let expected = Decimal::from_amount(
            200077279322612464128594731044417340495u128
                .checked_div(10u128.pow(8))
                .expect("scaled_down"),
        );
        assert_eq!(result, expected);

        // power function with decimal exponent, scaled down (floor) at lower precision
        // 42^1.5 = 272.191109
        let base = Decimal::new(42_000000000000, 12, false);
        let exp = Decimal::new(1500000000000, 12, false);
        let result = base.pow(exp).to_scale(6);
        let expected = Decimal {
            value: 272_191109,
            scale: 6,
            negative: false,
        };
        assert_eq!(result, expected);

        // power function with decimal exponent, scaled up (ceiling) at lower precision
        // 42^1.5 = 272.191110
        let base = Decimal::new(42_000000000000, 12, false);
        let exp = Decimal::new(1500000000000, 12, false);
        let result = base.pow(exp).to_scale_up(6);
        let expected = Decimal {
            value: 272_191110,
            scale: 6,
            negative: false,
        };
        assert_eq!(result, expected);

        // square root of 2 with accuracy scaled to 12 decimal places
        let n = Decimal::from_u64(2).to_scale(12);
        let result = n.sqrt().unwrap();
        let expected = Decimal::new(1_414_213_562_373u128, 12, false);
        assert_eq!(result, expected);

        // square root of 2 with accuracy scaled to 8 decimal places
        let n = Decimal::from_u64(2).to_scale(8);
        let result = n.sqrt().unwrap();
        let expected = Decimal::new(1_414_213_56_u128, 8, false);
        assert_eq!(result, expected);

        // square root of 2 with accuracy scaled to 6 decimal places
        // with last digit rounded up
        let n = Decimal::from_u64(2).to_scale(8);
        let result = n.sqrt().unwrap().to_scale_up(6);
        let expected = Decimal::new(1_414_214u128, 6, false);
        assert_eq!(result, expected);
    }

    #[test]
    fn test_new() {
        {
            let value = 42;
            let scale = 3;
            let actual = Decimal::new(value, scale, false);
            let expected = Decimal {
                value,
                scale,
                negative: false,
            };

            assert_eq!({ actual.value }, { expected.value });
            assert_eq!(actual.scale, expected.scale);
        }
    }

    #[test]
    fn test_denominator() {
        {
            let decimal = Decimal::new(42, 2, false);
            let actual = decimal.denominator();
            let expected = 10u128.pow(2);
            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(42, 0, false);
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
            negative: false,
        };

        assert_eq!({ actual.value }, { expected.value });
        assert_eq!(actual.scale, expected.scale);
    }

    #[test]
    fn test_from_amount() {
        let amount: u128 = 42;
        let actual = Decimal::from_amount(amount);
        let expected = Decimal {
            value: 42,
            scale: 8,
            negative: false,
        };

        assert_eq!({ actual.value }, { expected.value });
        assert_eq!(actual.scale, expected.scale);
    }

    #[test]
    fn test_to_amount() {
        // greater than AMOUNT_SCALE
        {
            {
                let decimal = Decimal::new(4242, 10, false);
                let actual = decimal.to_amount();
                let expected = Decimal::new(42, 8, false);

                assert_eq!({ actual.value }, { expected.value });
                assert_eq!(actual.scale, expected.scale);
            }

            {
                let decimal = Decimal::new(4242, 13, false);
                let actual = decimal.to_amount();
                let expected = Decimal::new(0, 8, false);

                assert_eq!({ actual.value }, { expected.value });
                assert_eq!(actual.scale, expected.scale);
            }
        }

        // equal to AMOUNT_SCALE
        {
            let decimal = Decimal::new(4242, 8, false);
            let actual = decimal.to_amount();
            let expected = Decimal::new(4242, 8, false);

            assert_eq!({ actual.value }, { expected.value });
            assert_eq!(actual.scale, expected.scale);
        }

        // less than AMOUNT_SCALE
        {
            let decimal = Decimal::new(4242, 6, false);
            let actual = decimal.to_amount();
            let expected = Decimal::new(424200, 8, false);

            assert_eq!({ actual.value }, { expected.value });
            assert_eq!(actual.scale, expected.scale);
        }
    }

    #[test]
    fn test_to_u64() {
        let decimal = Decimal::new(69420, 6, false);
        let actual = decimal.to_u64();
        let expected: u64 = 69420;

        assert_eq!(actual, expected);
    }

    #[test]
    fn test_to_scale() {
        // increase precision
        {
            let decimal = Decimal::new(42, 2, false);
            let result = decimal.to_scale(3);

            assert_eq!(result.scale, 3);
            assert_eq!({ result.value }, 420);
        }
        // decrease precision
        {
            let decimal = Decimal::new(42, 2, false);
            let result = decimal.to_scale(1);

            assert_eq!(result.scale, 1);
            assert_eq!({ result.value }, 4);
        }
        // decrease precision past value
        {
            let decimal = Decimal::new(123, 4, false);
            let result = decimal.to_scale(0);

            assert_eq!(result.scale, 0);
            assert_eq!({ result.value }, 0);
        }
    }

    #[test]
    fn test_to_scale_up() {
        // increase precision
        {
            let decimal = Decimal::new(42, 2, false);
            let result = decimal.to_scale_up(3);

            assert_eq!(result.scale, 3);
            assert_eq!({ result.value }, 420);
        }
        // decrease precision
        {
            let decimal = Decimal::new(42, 2, false);
            let result = decimal.to_scale_up(1);

            assert_eq!(result.scale, 1);
            assert_eq!({ result.value }, 5);
        }
        // decrease precision past value
        {
            let decimal = Decimal::new(123, 4, false);
            let result = decimal.to_scale_up(0);

            assert_eq!(result.scale, 0);
            assert_eq!({ result.value }, 1);
        }
    }

    #[test]
    fn test_mul_decimal() {
        let decimal = Decimal::new(1234, 3, false);
        let multiply_by = Decimal::new(4321, 5, false);
        let actual = decimal.mul(multiply_by);
        let expected = Decimal::new(53, 3, false);

        assert_eq!({ actual.value }, { expected.value });
        assert_eq!(actual.scale, expected.scale);
    }

    #[test]
    #[should_panic]
    fn test_mul_decimal_panic() {
        let decimal = Decimal::new(u128::MAX - 1, 3, false);
        let multiply_by = Decimal::new(2, 3, false);
        decimal.mul(multiply_by);
    }

    #[test]
    fn test_mul_u128() {
        {
            let decimal = Decimal::new(9876, 2, false);
            let multiply_by: u128 = 555;
            let actual = decimal.mul(multiply_by);
            let expected = Decimal::new(5481180, 2, false);

            assert_eq!({ actual.value }, { expected.value });
            assert_eq!(actual.scale, expected.scale);
        }
    }

    #[test]
    #[should_panic]
    fn test_mul_u128_panic() {
        let decimal = Decimal::new(u128::MAX - 1, 2, false);
        let multiply_by = 2;
        decimal.mul(multiply_by);
    }

    #[test]
    fn test_add() {
        {
            let decimal = Decimal::new(1337, 6, false);
            let increase_by = Decimal::new(555, 2, false);
            let actual = decimal.add(increase_by);

            assert!(actual.is_err());
        }

        {
            let decimal = Decimal::new(1337, 6, false);
            let increase_by = Decimal::new(555, 6, false);
            let actual = decimal.add(increase_by).unwrap();
            let expected = Decimal::new(1892, 6, false);

            assert_eq!({ actual.value }, { expected.value });
        }
    }

    #[test]
    #[should_panic(expected = "checked_add")]
    fn test_add_panic() {
        let decimal = Decimal::new(u128::MAX - 1, 2, false);
        let increase_by = Decimal::new(2, 2, false);
        assert!(decimal.add(increase_by).is_err());
    }

    #[test]
    fn test_sub() {
        {
            let decimal = Decimal::new(1337, 6, false);
            let decrease_by = Decimal::new(555, 2, false);
            let actual = decimal.sub(decrease_by);

            assert!(actual.is_err());
        }

        {
            let decimal = Decimal::new(1337, 6, false);
            let decrease_by = Decimal::new(555, 6, false);
            let actual = decimal.sub(decrease_by).unwrap();
            let expected = Decimal::new(782, 6, false);

            assert_eq!({ actual.value }, { expected.value });
        }

        {
            let decimal = Decimal::new(10, 6, false);
            let decrease_by = Decimal::new(15, 6, false);
            let actual = decimal.sub(decrease_by).unwrap();
            let expected = Decimal::new(5, 6, true);

            assert_eq!({ actual.negative }, { expected.negative });
        }

        {
            let decimal = Decimal::new(10, 6, true);
            let decrease_by = Decimal::new(15, 6, true);
            let actual = decimal.sub(decrease_by).unwrap();
            let expected = Decimal::new(25, 6, true);

            assert_eq!({ actual.negative }, { expected.negative });
        }
    }

    #[test]
    fn test_div() {
        {
            let decimal = Decimal::new(20, 8, false);
            let divide_by = Decimal::new(2, 3, false);
            let actual = decimal.div(divide_by);
            let expected = Decimal::new(10000, 8, false);

            assert_eq!({ actual.value }, { expected.value });
        }

        {
            let decimal = Decimal::new(20, 8, false);
            let divide_by = Decimal::new(3, 3, false);
            let actual = decimal.div(divide_by);
            let expected = Decimal::new(6666, 8, false);

            assert_eq!({ actual.value }, { expected.value });
        }
    }

    #[test]
    #[should_panic(expected = "checked_div")]
    fn test_div_panic() {
        let decimal = Decimal::new(10, 3, false);
        let divide_by = Decimal::new(0, 1, false);
        decimal.div(divide_by);
    }

    #[test]
    fn test_into_u64() {
        {
            let decimal = Decimal::new(333333333333333, 15, false);
            let actual: u64 = decimal.into();
            let expected: u64 = 333333333333333;

            assert_eq!(actual, expected);
        }
    }

    #[test]
    #[should_panic]
    #[allow(unused_variables)]
    fn test_into_u64_panic() {
        let decimal = Decimal::new(u128::MAX - 1, 15, false);
        let result: u64 = decimal.into();
    }

    #[test]
    fn test_into_u128() {
        {
            let decimal = Decimal::new(111000111, 10, false);
            let actual: u128 = decimal.into();
            let expected: u128 = 111000111;

            assert_eq!(actual, expected);
        }
    }

    #[test]
    fn test_lte() {
        {
            let decimal = Decimal::new(1001, 4, false);
            let other = Decimal::new(33, 2, false);
            let result = decimal.lte(other);

            assert!(result.is_err());
        }

        {
            let decimal = Decimal::new(1001, 4, false);
            let other = Decimal::new(33, 4, false);
            let actual = decimal.lte(other).unwrap();
            let expected = false;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(33, 4, false);
            let other = Decimal::new(33, 4, false);
            let actual = decimal.lte(other).unwrap();
            let expected = true;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(10, 4, false);
            let other = Decimal::new(33, 4, false);
            let actual = decimal.lte(other).unwrap();
            let expected = true;

            assert_eq!(actual, expected);
        }
    }

    #[test]
    fn test_lt() {
        {
            let decimal = Decimal::new(1001, 4, false);
            let other = Decimal::new(33, 2, false);
            let result = decimal.lt(other);

            assert!(result.is_err());
        }

        {
            let decimal = Decimal::new(1001, 4, false);
            let other = Decimal::new(33, 4, false);
            let actual = decimal.lt(other).unwrap();
            let expected = false;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(33, 4, false);
            let other = Decimal::new(33, 4, false);
            let actual = decimal.lt(other).unwrap();
            let expected = false;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(10, 4, false);
            let other = Decimal::new(33, 4, false);
            let actual = decimal.lt(other).unwrap();
            let expected = true;

            assert_eq!(actual, expected);
        }
    }

    #[test]
    fn test_gt() {
        {
            let decimal = Decimal::new(1001, 4, false);
            let other = Decimal::new(33, 2, false);
            let result = decimal.gt(other);

            assert!(result.is_err());
        }

        {
            let decimal = Decimal::new(1001, 4, false);
            let other = Decimal::new(33, 4, false);
            let actual = decimal.gt(other).unwrap();
            let expected = true;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(33, 4, false);
            let other = Decimal::new(33, 4, false);
            let actual = decimal.gt(other).unwrap();
            let expected = false;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(10, 4, false);
            let other = Decimal::new(33, 4, false);
            let actual = decimal.gt(other).unwrap();
            let expected = false;

            assert_eq!(actual, expected);
        }
    }

    #[test]
    fn test_gte() {
        {
            let decimal = Decimal::new(1001, 4, false);
            let other = Decimal::new(33, 2, false);
            let result = decimal.gte(other);

            assert!(result.is_err());
        }

        {
            let decimal = Decimal::new(1001, 4, false);
            let other = Decimal::new(33, 4, false);
            let actual = decimal.gte(other).unwrap();
            let expected = true;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(33, 4, false);
            let other = Decimal::new(33, 4, false);
            let actual = decimal.gte(other).unwrap();
            let expected = true;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(10, 4, false);
            let other = Decimal::new(33, 4, false);
            let actual = decimal.gte(other).unwrap();
            let expected = false;

            assert_eq!(actual, expected);
        }
    }

    #[test]
    fn test_eq() {
        {
            let decimal = Decimal::new(1001, 4, false);
            let other = Decimal::new(33, 2, false);
            let result = decimal.eq(other);

            assert!(result.is_err());
        }

        {
            let decimal = Decimal::new(1001, 4, false);
            let other = Decimal::new(33, 4, false);
            let actual = decimal.eq(other).unwrap();
            let expected = false;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(33, 4, false);
            let other = Decimal::new(33, 4, false);
            let actual = decimal.eq(other).unwrap();
            let expected = true;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(10, 4, false);
            let other = Decimal::new(33, 4, false);
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
            let base = Decimal::new(0, decimal, false);
            let exp: u128 = 100;
            let result = base.pow(exp);
            let expected = Decimal::new(0, decimal, false);
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
        let base = Decimal::new(42, 6, false);
        let exp = Decimal::new(0, 6, false);
        let result = base.pow(exp);
        let expected = Decimal::new(1, 6, false);
        assert_eq!(result, expected);

        // 42^0.25 = 2.545729895021831
        let base = Decimal::new(42_000000000000, 12, false);
        let exp = Decimal::new(250000000000, 12, false);
        let result = base.pow(exp);
        let expected = Decimal {
            value: 2_545_729_895_021u128,
            scale: 12,
            negative: false,
        };
        assert_eq!(result, expected);

        // 42^0.5 = 6.48074069840786
        let base = Decimal::new(42_000000000000, 12, false);
        let exp = Decimal::new(500000000000, 12, false);
        let result = base.pow(exp);
        let expected = Decimal {
            value: 6_480_740_698_407u128,
            scale: 12,
            negative: false,
        };
        assert_eq!(result, expected);

        // 42^1 = 42
        let base = Decimal::new(42_000000000000, 12, false);
        let exp = Decimal::new(1000000000000, 12, false);
        let result = base.pow(exp);
        let expected = Decimal {
            value: 42_000000000000u128,
            scale: 12,
            negative: false,
        };
        assert_eq!(result, expected);

        // 42^1.25 = 106.920655590916882
        let base = Decimal::new(42_000000000000, 12, false);
        let exp = Decimal::new(1250000000000, 12, false);
        let result = base.pow(exp);
        let expected = Decimal {
            value: 106_920_655_590_882u128,
            scale: 12,
            negative: false,
        };
        assert_eq!(result, expected);

        // 42^1.5 = 272.19110933313013
        let base = Decimal::new(42_000000000000, 12, false);
        let exp = Decimal::new(1500000000000, 12, false);
        let result = base.pow(exp);
        let expected = Decimal {
            value: 272_191_109_333_094,
            scale: 12,
            negative: false,
        };
        assert_eq!(result, expected);

        // 42^2 = 1764
        let base = Decimal::new(42_000000000000, 12, false);
        let exp = Decimal::new(2000000000000, 12, false);
        let result = base.pow(exp);
        let expected = Decimal {
            value: 1764_000000000000u128,
            scale: 12,
            negative: false,
        };
        assert_eq!(result, expected);
    }

    #[test]
    fn test_mul_up() {
        // mul of small number
        {
            let a = Decimal::new(1, 12, false);
            let b = Decimal::new(1, 12, false);
            assert_eq!(a.mul_up(b), Decimal::new(1, 12, false));
        }

        // mul same precision
        // 1.000000 * 0.300000 = 0.300000
        {
            let a = Decimal::new(1000000, 6, false);
            let b = Decimal::new(300000, 6, false);
            assert_eq!(a.mul_up(b), Decimal::new(300000, 6, false));
        }

        // mul by zero
        // 1.00 * 0 = 0.00
        {
            let a = Decimal::new(100, 2, false);
            let b = Decimal::new(0, 0, false);
            assert_eq!(a.mul_up(b), Decimal::new(0, 2, false));
        }

        // mul different decimals increases precision
        {
            let a = Decimal::new(1_000_000_000, 9, false);
            let b = Decimal::new(3, 6, false);
            assert_eq!(a.mul_up(b), Decimal::new(3000, 9, false));
        }
    }

    #[test]
    fn test_div_up() {
        // 0/n = 0
        {
            let a = Decimal::new(0, 0, false);
            let b = Decimal::new(1, 0, false);
            assert_eq!(a.div_up(b), Decimal::new(0, 0, false));
        }

        // 1/2 = 1 rounded up
        {
            let a = Decimal::new(1, 0, false);
            let b = Decimal::new(2, 0, false);
            assert_eq!(a.div_up(b), Decimal::new(1, 0, false));
        }

        // 200,000.000001/2 = 100000.000001 rounded up
        {
            let a = Decimal::new(200_000_000_001, 6, false);
            let b = Decimal::new(2_000, 3, false);
            assert!(!a
                .div_up(b)
                .lt(Decimal::new(100_000_000_001, 6, false))
                .unwrap());
        }

        // 42.00/10 = 4.20 = 5.00 rounded up
        {
            let a = Decimal::new(42, 2, false);
            let b = Decimal::new(10, 0, false);
            assert_eq!(a.div_up(b), Decimal::new(5, 2, false));
        }
    }

    #[test]
    fn test_div_to_scale() {
        // nominator scale == denominator scale
        {
            let nominator = Decimal::new(20_000, 8, false);
            let denominator = Decimal::new(4, 8, false);

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
            let nominator = Decimal::new(35, 5, false);
            let denominator = Decimal::new(5, 1, false);

            // to_scale == nominator scale
            let to_scale = 7;
            let result = nominator.div_to_scale(denominator, to_scale);
            let expected = Decimal::new(7000, to_scale, false);
            assert_eq!(result, expected);

            // to_scale > nominator scale
            let to_scale = 9;
            let result = nominator.div_to_scale(denominator, to_scale);
            let expected = Decimal::new(700_000, to_scale, false);
            assert_eq!(result, expected);

            // to_scale < nominator scale
            let to_scale = 5;
            let result = nominator.div_to_scale(denominator, to_scale);
            let expected = Decimal::new(70, to_scale, false);
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
        let expected = Decimal::new(1_414_213_562_373u128, 12, false);
        assert_eq!(result, expected);

        // 3**0.5 = 1.7320508076
        let n = Decimal::from_u64(3).to_scale(12);
        let result = n.sqrt().unwrap();
        let expected = Decimal::new(1_732_050_807_568u128, 12, false);
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
        let n = Decimal::new(3_141_592_653_589u128, 12, false);
        let result = n.sqrt().unwrap();
        let expected = Decimal::new(1_772_453_850_905u128, 12, false);
        assert_eq!(result, expected);

        // 3.141592**0.5 = 1.772453
        let n = Decimal::new(3_141_592u128, 6, false);
        let result = n.sqrt().unwrap();
        let expected = Decimal::new(1_772_453u128, 6, false);
        assert_eq!(result, expected);
    }

    #[test]
    fn test_natural_log() {
        {
            // ln(10) = 2.302585092987

            let expected = Decimal {
                value: 2_302585092924u128,
                scale: 12,
                negative: false,
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
                negative: false,
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
        let lhs = Decimal::new(4, 0, true);
        let rhs = Decimal::new(3, 0, true);
        let expected = Decimal::new(7, 0, true);
        assert_eq!(lhs.add(rhs).unwrap(), expected);

        // -1 + 1 = 0
        let lhs = Decimal::new(1, 0, true);
        let rhs = Decimal::new(1, 0, false);
        let expected = Decimal::new(0, 0, false);
        assert_eq!(lhs.add(rhs).unwrap(), expected);

        // 3 + -5 = -2
        let lhs = Decimal::new(3, 0, false);
        let rhs = Decimal::new(5, 0, true);
        let expected = Decimal::new(2, 0, true);
        assert_eq!(lhs.add(rhs).unwrap(), expected);

        // -5 + 3 = -2
        let lhs = Decimal::new(5, 0, true);
        let rhs = Decimal::new(3, 0, false);
        let expected = Decimal::new(2, 0, true);
        assert_eq!(lhs.add(rhs).unwrap(), expected);

        // 5 + -2 = 3
        let lhs = Decimal::new(5, 0, false);
        let rhs = Decimal::new(2, 0, true);
        let expected = Decimal::new(3, 0, false);
        assert_eq!(lhs.add(rhs).unwrap(), expected);

        // -3 + 5 = 2
        let lhs = Decimal::new(3, 0, true);
        let rhs = Decimal::new(5, 0, false);
        let expected = Decimal::new(2, 0, false);
        assert_eq!(lhs.add(rhs).unwrap(), expected);

        // 1 + -2 = -1
        let lhs = Decimal::new(1, 0, false);
        let rhs = Decimal::new(2, 0, true);
        let expected = Decimal::new(1, 0, true);
        assert_eq!(lhs.add(rhs).unwrap(), expected);

        // 4 + 3 = 7
        let lhs = Decimal::new(4, 0, false);
        let rhs = Decimal::new(3, 0, false);
        let expected = Decimal::new(7, 0, false);
        assert_eq!(lhs.add(rhs).unwrap(), expected);
    }

    #[test]
    fn test_signed_mul() {
        // -4 * -3 = 12
        let lhs = Decimal::new(4, 0, true);
        let rhs = Decimal::new(3, 0, true);
        let expected = Decimal::new(12, 0, false);
        assert_eq!(lhs.mul(rhs), expected);

        // -4 * 3 = -12
        let lhs = Decimal::new(4, 0, true);
        let rhs = Decimal::new(3, 0, false);
        let expected = Decimal::new(12, 0, true);
        assert_eq!(lhs.mul(rhs), expected);

        // 4 * -3 = -12
        let lhs = Decimal::new(4, 0, false);
        let rhs = Decimal::new(3, 0, true);
        let expected = Decimal::new(12, 0, true);
        assert_eq!(lhs.mul(rhs), expected);

        // 4 * 3 = 12
        let lhs = Decimal::new(4, 0, false);
        let rhs = Decimal::new(3, 0, false);
        let expected = Decimal::new(12, 0, false);
        assert_eq!(lhs.mul(rhs), expected);
    }

    #[test]
    fn test_signed_div() {
        // -12 / -3 = 4
        let lhs = Decimal::new(12, 0, true);
        let rhs = Decimal::new(3, 0, true);
        let expected = Decimal::new(4, 0, false);
        assert_eq!(lhs.div(rhs), expected);

        // -12 / 3 = -4
        let lhs = Decimal::new(12, 0, true);
        let rhs = Decimal::new(3, 0, false);
        let expected = Decimal::new(4, 0, true);
        assert_eq!(lhs.div(rhs), expected);

        // 12 / -3 = -4
        let lhs = Decimal::new(12, 0, false);
        let rhs = Decimal::new(3, 0, true);
        let expected = Decimal::new(4, 0, true);
        assert_eq!(lhs.div(rhs), expected);

        // 12 / 3 = 4
        let lhs = Decimal::new(12, 0, false);
        let rhs = Decimal::new(3, 0, false);
        let expected = Decimal::new(4, 0, false);
        assert_eq!(lhs.div(rhs), expected);
    }
}
