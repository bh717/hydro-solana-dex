use ndarray::{arr2, Array2};
use std::convert::TryInto;
use std::fmt;
use std::iter::repeat;
use std::ops::Neg;
use std::str::FromStr;
use thiserror::Error;

/// Internal scale used for high precision compute operations
pub const COMPUTE_SCALE: u8 = 12;

/// Error codes related to [Decimal].
#[derive(Error, Debug)]
pub enum ErrorCode {
    #[error("Unable to parse input")]
    ParseError,
    #[error("Unable to parse empty input")]
    ParseErrorEmpty,
    #[error("Unable to parse non base 10 input")]
    ParseErrorBase10,
    #[error("Scale is different")]
    DifferentScale,
    #[error("Exceeds allowable range for value")]
    ExceedsRange,
    #[error("Exceeds allowable range for precision")]
    ExceedsPrecisionRange,
    #[error("Signed decimals not supported for this function")]
    SignedDecimalsNotSupported,
}

/// [Decimal] representation of a number with a value, scale (precision in terms of number of decimal places
/// and a negative boolean to handle signed arithmetic.
#[derive(Clone, Copy, PartialEq, Debug, Error)]
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

    pub fn one() -> Decimal {
        Decimal::from_u64(1).to_compute_scale()
    }

    pub fn two() -> Decimal {
        Decimal::from_u64(2).to_compute_scale()
    }

    /// Create a [Decimal] from an unsigned integer, assumed positive by default.
    pub fn from_u64(integer: u64) -> Self {
        Decimal {
            value: integer.into(),
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

    /// Computes the absolute value of a [Decimal]
    /// and round down (floor) the value.
    pub fn abs(self) -> u64 {
        self.to_scale(0).to_u64()
    }

    /// Computes the absolute value of a [Decimal]
    /// and round up (ceiling) the value.
    pub fn abs_up(self) -> u64 {
        self.to_scale_up(0).to_u64()
    }

    /// Create a [Decimal] from an unsigned amount with scale, assumed positive by default.
    pub fn from_scaled_amount(amount: u64, scale: u8) -> Self {
        Decimal {
            value: amount.into(),
            scale: scale.into(),
            ..Decimal::default()
        }
    }

    /// Convert a [Decimal] back to a scaled u64 amount.
    pub fn to_scaled_amount(self, scale: u8) -> u64 {
        self.to_scale(scale).to_u64()
    }

    /// Convert a [Decimal] back to a scaled u64 amount
    /// and round up (ceiling) the value.
    pub fn to_scaled_amount_up(self, scale: u8) -> u64 {
        self.to_scale_up(scale).to_u64()
    }

    /// Modify the scale (precision) of a [Decimal] to a different scale.
    pub fn to_scale(self, scale: u8) -> Self {
        Self {
            value: if self.scale > scale {
                self.value
                    .checked_div(10u128.pow((self.scale.checked_sub(scale).unwrap()).into()))
                    .expect("scaled_down")
            } else {
                self.value
                    .checked_mul(10u128.pow((scale.checked_sub(self.scale).unwrap()).into()))
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
                10u128.pow((self.scale.checked_sub(scale).unwrap()).try_into().unwrap()),
                0,
                self.negative,
            ))
        } else {
            decimal.mul_up(Self::new(
                10u128.pow((scale.checked_sub(self.scale).unwrap()).try_into().unwrap()),
                0,
                self.negative,
            ))
        }
    }

    /// Convert to a higher precision compute scale
    pub fn to_compute_scale(self) -> Self {
        self.to_scale(COMPUTE_SCALE)
    }

    /// Show the scale of a [Decimal] expressed as a power of 10.
    pub fn denominator(self) -> u128 {
        10u128.pow(self.scale.into())
    }

    /// Returns true if [Decimal] is positive and false if the number is zero or negative.
    pub fn is_positive(self) -> bool {
        !self.negative && !self.is_zero()
    }

    /// Returns true if [Decimal] is negative and false if the number is zero or positive.
    pub fn is_negative(self) -> bool {
        self.negative && !self.is_zero()
    }

    /// Returns true if [Decimal] value is zero.
    pub fn is_zero(self) -> bool {
        self.value == 0
    }

    /// Returns true if and only if the [Decimal] is an exact integer.
    pub fn is_integer(self) -> bool {
        let integer = self.to_scale(0).to_scale(self.scale);

        self.sub(integer).expect("zero").is_zero()
    }

    /// Converts a string slice in a given base to a [Decimal].
    /// The string is expected to be an optional - sign followed by digits.
    /// Leading and trailing whitespace represent an error.
    /// Digits are a subset of these characters, depending on radix.
    /// This function panics if radix is not in the range base 10.
    fn from_str_radix(s: &str, radix: u32) -> Result<Decimal, ErrorCode> {
        if radix != 10 {
            return Err(ErrorCode::ParseErrorBase10.into());
        }

        let exp_separator: &[_] = &['e', 'E'];

        // split slice into base and exponent parts
        let (base, exp) = match s.find(exp_separator) {
            // exponent defaults to 0 if (e|E) not found
            None => (s, 0),

            // split and parse exponent field
            Some(loc) => {
                // slice up to `loc` and 1 after to skip the 'e' char
                let (base, exp) = (&s[..loc], &s[loc + 1..]);
                (base, i64::from_str(exp).unwrap())
            }
        };

        if base == "" {
            return Err(ErrorCode::ParseErrorEmpty.into());
        }

        // look for signed (negative) decimals
        let (base, negative): (String, _) = match base.find('-') {
            // no sign found, pass to Decimal
            None => (base.to_string(), false),
            Some(loc) => {
                if loc == 0 {
                    (String::from(&base[1..]), true)
                } else {
                    // negative sign not in the first position
                    return Err(ErrorCode::ParseError.into());
                }
            }
        };

        // split decimal into a digit string and decimal-point offset
        let (digits, decimal_offset): (String, _) = match base.find('.') {
            // no decimal point found, pass directly to Decimal
            None => (base.to_string(), 0),

            // decimal point found - copy into new string buffer
            Some(loc) => {
                // split into leading and trailing digits
                let (lead, trail) = (&base[..loc], &base[loc + 1..]);

                // copy all leading characters into 'digits' string
                let mut digits = String::from(lead);

                // copy all trailing characters after '.' into the digits string
                digits.push_str(trail);

                (digits, trail.len() as i64)
            }
        };

        let scale = (decimal_offset - exp).abs() as u8;

        if exp.is_positive() {
            Ok(Decimal::new(
                Decimal::from_str(base.as_str())
                    .expect("decimal of base")
                    .to_scale(exp.abs() as u8)
                    .value,
                0,
                negative,
            )
            .to_scale(exp.abs() as u8))
        } else {
            Ok(Decimal::new(
                u128::from_str_radix(&digits, radix).unwrap(),
                scale,
                negative,
            ))
        }
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
            if self.negative == rhs.negative {
                // covers when both positive, and both negative.
                // just add the add absolute values and use common sign
                Ok(Self {
                    value: self.value.checked_add(rhs.value).expect("checked_add"),
                    scale: self.scale,
                    negative: self.negative,
                })
            } else {
                // if different signs
                // value is the difference of absolute values.
                // (so need to know which has bigger absolute value)
                // sign is the sign of the one with bigger absolute value
                if self.value > rhs.value {
                    // e.g: 4 + (-3) = 1 ; -4 + 3 = -1;
                    Ok(Self {
                        value: self.value.checked_sub(rhs.value).expect("checked_sub"),
                        scale: self.scale,
                        negative: self.negative,
                    })
                } else if self.value < rhs.value {
                    // e.g: 2 + (-5) = -3 ; -2 + 5 = 3;
                    Ok(Self {
                        value: rhs.value.checked_sub(self.value).expect("checked_sub"),
                        scale: self.scale,
                        negative: rhs.negative,
                    })
                } else {
                    // if equal abs value and opposite sign then result is zero
                    Ok(Self {
                        value: 0,
                        scale: self.scale,
                        negative: false,
                    })
                }
            }
        }
    }
}

/// Subtract another [Decimal] value from itself, including signed subtraction.
impl Sub<Decimal> for Decimal {
    fn sub(self, rhs: Decimal) -> Result<Self, ErrorCode> {
        // as a - b is always a + (-b) ; let add handle it
        // simplify: flip b's sign and let Add handle it
        let new_rhs = Decimal {
            negative: !rhs.negative,
            ..rhs
        };
        self.add(new_rhs)
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
        let one = Decimal::from_u64(1).to_scale(self.scale);
        let zero_point_two_five = Decimal::from_u64(1)
            .to_scale(self.scale)
            .div(Decimal::from_u64(4).to_scale(self.scale));
        let zero_point_five = Decimal::from_u64(1)
            .to_scale(self.scale)
            .div(Decimal::from_u64(2).to_scale(self.scale));
        let one_point_two_five = Decimal::from_u64(5)
            .to_scale(self.scale)
            .div(Decimal::from_u64(4).to_scale(self.scale));
        let one_point_five = Decimal::from_u64(3)
            .to_scale(self.scale)
            .div(Decimal::from_u64(2).to_scale(self.scale));

        let exp = Option::Some(exp);
        match exp {
            // e.g. x^0 = 1
            Some(x) if x.is_zero() => one,
            // e.g. x^0.25 = ⁴√x = √(√x) = sqrt(sqrt(x))
            Some(x) if x.eq(zero_point_two_five).unwrap() => self.sqrt().unwrap().sqrt().unwrap(),
            // e.g. x^0.5 = √x = sqrt(x)
            Some(x) if x.eq(zero_point_five).unwrap() => self.sqrt().unwrap(),
            // e.g. x^1 = x
            Some(x) if x.eq(one).unwrap() => self.clone(),
            // e.g. x^1.25 = x(√(√x)) = x(sqrt(sqrt(x)))
            Some(x) if x.eq(one_point_two_five).unwrap() => {
                self.mul(self.sqrt().unwrap().sqrt().unwrap())
            }
            // e.g. x^1.50 = x(√x) = x(sqrt(x))
            Some(x) if x.eq(one_point_five).unwrap() => self.mul(self.sqrt().unwrap()),
            // e.g. x^2
            Some(x) if x.is_integer() && x.is_positive() => self.pow(x.abs() as u128),
            // e.g. x^-2 == 1/x^2
            Some(x) if x.is_integer() && x.is_negative() => one.div(self.pow(x.abs() as u128)),
            // e.g. x^-0.5 = 1/x^0.5
            Some(x) if x.is_negative() => one.div(self.pow(Decimal::new(x.value, x.scale, false))),
            _ => panic!(
                "pow not implemented for exponent: {}",
                exp.unwrap().to_string()
            ),
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

/// Convert a [Decimal] into an usize.
impl Into<usize> for Decimal {
    fn into(self) -> usize {
        self.value.try_into().unwrap()
    }
}

/// Convert a [Decimal] into an unsigned 64-bit float.
impl Into<f64> for Decimal {
    fn into(self) -> f64 {
        self.value as f64 / self.denominator() as f64
    }
}

/// Convert a [Decimal] into a signed 32-bit integer.
impl Into<i32> for Decimal {
    fn into(self) -> i32 {
        let sign = if self.negative { -1i32 } else { 1i32 };
        (self.value as i32)
            .checked_mul(sign)
            .expect("signed integer")
    }
}

/// Compare two [Decimal] values/scale with comparison query operators.
impl Compare<Decimal> for Decimal {
    /// Show if two [Decimal] values equal each other
    fn eq(self, other: Decimal) -> Result<bool, ErrorCode> {
        if !(self.scale == other.scale) {
            return Err(ErrorCode::DifferentScale.into());
        } else {
            Ok(self.value == other.value && self.negative == other.negative)
        }
    }

    /// Show if one [Decimal] value is less than another.
    fn lt(self, other: Decimal) -> Result<bool, ErrorCode> {
        if !(self.scale == other.scale) {
            return Err(ErrorCode::DifferentScale.into());
        } else {
            if self.negative && other.negative {
                Ok(self.value > other.value)
            } else if self.negative && !other.negative {
                Ok(true)
            } else if !self.negative && other.negative {
                Ok(false)
            } else {
                Ok(self.value < other.value)
            }
        }
    }

    /// Show if one [Decimal] value is greater than another.
    fn gt(self, other: Decimal) -> Result<bool, ErrorCode> {
        if !(self.scale == other.scale) {
            return Err(ErrorCode::DifferentScale.into());
        } else {
            if self.negative && other.negative {
                Ok(self.value < other.value)
            } else if self.negative && !other.negative {
                Ok(false)
            } else if !self.negative && other.negative {
                Ok(true)
            } else {
                Ok(self.value > other.value)
            }
        }
    }

    /// Show if one [Decimal] value is greater than or equal to another.
    fn gte(self, other: Decimal) -> Result<bool, ErrorCode> {
        if !(self.scale == other.scale) {
            return Err(ErrorCode::DifferentScale.into());
        } else {
            if self.negative && other.negative {
                Ok(self.value <= other.value)
            } else if self.negative && !other.negative {
                Ok(false)
            } else if !self.negative && other.negative {
                Ok(true)
            } else {
                Ok(self.value >= other.value)
            }
        }
    }

    /// Show if one [Decimal] value is less than or equal to another.
    fn lte(self, other: Decimal) -> Result<bool, ErrorCode> {
        if !(self.scale == other.scale) {
            return Err(ErrorCode::DifferentScale.into());
        } else {
            if self.negative && other.negative {
                Ok(self.value >= other.value)
            } else if self.negative && !other.negative {
                Ok(true)
            } else if !self.negative && other.negative {
                Ok(false)
            } else {
                Ok(self.value <= other.value)
            }
        }
    }

    fn min(self, other: Decimal) -> Decimal {
        if self.lte(other).unwrap() {
            self
        } else {
            other
        }
    }

    fn max(self, other: Decimal) -> Decimal {
        if self.gte(other).unwrap() {
            self
        } else {
            other
        }
    }
}

impl Neg for Decimal {
    type Output = Self;

    fn neg(self) -> Self::Output {
        if self.is_negative() {
            Self {
                value: self.value,
                scale: self.scale,
                negative: false,
            }
        } else if self.is_positive() {
            Self {
                value: self.value,
                scale: self.scale,
                negative: true,
            }
        } else {
            self
        }
    }
}

impl FromStr for Decimal {
    type Err = ErrorCode;

    #[inline]
    fn from_str(s: &str) -> Result<Decimal, ErrorCode> {
        Decimal::from_str_radix(s, 10)
    }
}

impl fmt::Display for Decimal {
    fn fmt(&self, f: &mut fmt::Formatter) -> Result<(), fmt::Error> {
        let scale = self.scale as usize;
        let mut rep = self.value.to_string();
        let len = rep.len();

        // inject decimal point
        if scale > 0 {
            if scale > len {
                let mut new_rep = String::new();
                let zeros = repeat("0").take(scale as usize - len).collect::<String>();
                new_rep.push_str("0.");
                new_rep.push_str(&zeros[..]);
                new_rep.push_str(&rep[..]);
                rep = new_rep;
            } else if scale == len {
                rep.insert(0, '.');
                rep.insert(0, '0');
            } else {
                rep.insert(len - scale as usize, '.');
            }
        } else if rep.is_empty() {
            // corner case for truncated decimals
            rep.insert(0, '0');
        }

        f.pad_integral(!self.negative, "", &rep)
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
) -> (Decimal, Decimal, u128) {
    let s_value = s_value.div(t_value);
    let place_value = 10u128.checked_pow((log_table_col + 1) as u32).unwrap();
    let f_value = Decimal::new(place_value, s_value.scale, false);
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

/// Function that determines the bit length of a positive [Decimal]
/// based on the formula: int(log(value)/log(2))
impl BitLength<Decimal> for Decimal {
    fn bit_length(self) -> Result<Self, ErrorCode> {
        if self.is_negative() {
            return Err(ErrorCode::SignedDecimalsNotSupported.into());
        } else {
            if self.is_zero() {
                Ok(Decimal::from_u64(0))
            } else {
                let value: f64 = self.into();
                let log_value_div_log_two = value.log(2.0);

                let value = log_value_div_log_two.abs() * (self.denominator() as f64);
                let scale = self.scale;
                let negative = log_value_div_log_two.is_sign_negative();

                let value = Decimal::new(value as u128, scale, negative);
                let value = if negative {
                    value.to_scale_up(0)
                } else {
                    value.to_scale(0)
                };

                Ok(Decimal::new(value.into(), 0, negative))
            }
        }
    }
}

/// Calculate the natural logarithm of a [Decimal] value. For full algorithm please refer to:
// https://docs.google.com/spreadsheets/d/19mgYjGQlpsuaTk1zXujn-yCSdbAL25sP/edit?pli=1#gid=2070648638
impl Ln<Decimal> for Decimal {
    fn ln(self) -> Result<Self, ErrorCode> {
        if self.is_negative() {
            return Err(ErrorCode::SignedDecimalsNotSupported.into());
        }

        let scaled_out = self.to_compute_scale();

        let ln_2_decimal = Decimal::new(693_147_180_559u128, 12, false);

        let bit_length_decimal = self.bit_length().expect("bit_length");

        // TODO: calculate with higher compute scale when big_mul is implemented otherwise overflow
        let max = Decimal::from_u64(2)
            .to_scale(6)
            .pow(bit_length_decimal.to_scale(6))
            .to_compute_scale();

        let (s_0, t_0, lx_0) = log_table_value(scaled_out, max, 0);
        let (s_1, t_1, lx_1) = log_table_value(s_0, t_0, 1);
        let (s_2, t_2, lx_2) = log_table_value(s_1, t_1, 2);
        let (s_3, t_3, lx_3) = log_table_value(s_2, t_2, 3);
        let (s_4, t_4, lx_4) = log_table_value(s_3, t_3, 4);
        let (s_5, t_5, lx_5) = log_table_value(s_4, t_4, 5);
        let (s_6, t_6, lx_6) = log_table_value(s_5, t_5, 6);
        let (s_7, t_7, lx_7) = log_table_value(s_6, t_6, 7);
        let (s_8, t_8, lx_8) = log_table_value(s_7, t_7, 8);
        let (_s_9, _t_9, lx_9) = log_table_value(s_8, t_8, 9);

        let lx_sum = lx_0
            .checked_add(lx_1)
            .unwrap()
            .checked_add(lx_2)
            .unwrap()
            .checked_add(lx_3)
            .unwrap()
            .checked_add(lx_4)
            .unwrap()
            .checked_add(lx_5)
            .unwrap()
            .checked_add(lx_6)
            .unwrap()
            .checked_add(lx_7)
            .unwrap()
            .checked_add(lx_8)
            .unwrap()
            .checked_add(lx_9)
            .unwrap();

        let lx_sum_decimal = Decimal::new(lx_sum, 12, scaled_out.negative);

        Ok(ln_2_decimal
            .mul(bit_length_decimal)
            .add(lx_sum_decimal)
            .unwrap()
            .to_scale(self.scale))
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

pub trait BitLength<T>: Sized {
    fn bit_length(self) -> Result<Self, ErrorCode>;
}

pub trait Compare<T>: Sized {
    fn eq(self, rhs: T) -> Result<bool, ErrorCode>;
    fn lt(self, rhs: T) -> Result<bool, ErrorCode>;
    fn gt(self, rhs: T) -> Result<bool, ErrorCode>;
    fn gte(self, rhs: T) -> Result<bool, ErrorCode>;
    fn lte(self, rhs: T) -> Result<bool, ErrorCode>;
    fn min(self, rhs: T) -> Self;
    fn max(self, rhs: T) -> Self;
}

#[cfg(test)]
mod test {
    use super::*;

    use proptest::prelude::*;

    #[test]
    fn test_basic_examples() {
        {
            // 1.000000 * 1.000000 = 1.000000
            let a = Decimal::from_scaled_amount(1_000000, 6);
            let b = Decimal::from_scaled_amount(1_000000, 6);
            let actual = a.mul(b);
            let expected = Decimal {
                value: 1_000000,
                scale: 6,
                negative: false,
            };
            assert_eq!(actual, expected)
        }
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

        let lhs = Decimal::from_scaled_amount(17134659154348278833, 6);
        let rhs = Decimal::from_scaled_amount(11676758639919526015, 6);
        let result = lhs.mul(rhs);
        let expected = Decimal::new(200077279322612464128594731044417, 6, false);
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
        let n = Decimal::from_u64(2).to_compute_scale();
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

    proptest! {
        #[test]
        fn test_full_u64_range(
            lhs in 1_000_000..u64::MAX, // 1.000000 .. 18,446,744,073,709.551615
            rhs in 1_000_000..u64::MAX,
        ) {
            let scale = 6; // decimal places
            let precision = 2; // accuracy +/- 0.000001
            let lhs_decimal = Decimal::from_scaled_amount(lhs, scale);
            let rhs_decimal = Decimal::from_scaled_amount(rhs, scale);
            let lhs_f64: f64 = lhs_decimal.into();
            let den_f64: f64 = lhs_decimal.denominator() as f64;

            // basic math both sides
            {
                lhs_decimal.mul(rhs_decimal);
                lhs_decimal.div(rhs_decimal);
                lhs_decimal.add(rhs_decimal).unwrap();
                lhs_decimal.sub(rhs_decimal).unwrap();
            }

            // basic math one side
            {
                lhs_decimal.mul(lhs_decimal);
                lhs_decimal.div(lhs_decimal);
                lhs_decimal.add(lhs_decimal).unwrap();
                lhs_decimal.sub(lhs_decimal).unwrap();
            }

            // f64 sqrt == Decimal sqrt
            {
                let sqrt_f64_u128 = (((lhs_f64.sqrt() * den_f64).round() / den_f64) * den_f64) as u128;
                let sqrt_decimal_u128 = lhs_decimal.to_scale(scale).sqrt().unwrap().value;
                let difference = sqrt_f64_u128.saturating_sub(sqrt_decimal_u128).lt(&precision);

                assert!(difference, "sqrt compare\n{}\n{}", sqrt_f64_u128, sqrt_decimal_u128);
            }

            // f64 ln == Decimal ln
            {
                let ln_f64_u128 = (((lhs_f64.ln() * den_f64).round() / den_f64) * den_f64) as u128;
                let ln_decimal_u128 = lhs_decimal.to_scale(scale).ln().unwrap().value;
                let difference = ln_f64_u128.saturating_sub(ln_decimal_u128).lt(&precision);

                assert!(difference, "ln compare\n{}\n{}", ln_f64_u128, ln_decimal_u128);
            }
        }
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
    fn test_from_scaled_integer() {
        let integer: u64 = 42_000000;
        let scale = 6;
        let actual = Decimal::from_scaled_amount(integer, scale);
        let expected = Decimal {
            value: 42_000000,
            scale: 6,
            negative: false,
        };

        assert_eq!({ actual.value }, { expected.value });
        assert_eq!(actual.scale, expected.scale);
    }

    #[test]
    fn test_to_u64() {
        let decimal = Decimal::new(69420, 6, false);
        let actual = decimal.to_u64();
        let expected: u64 = 69420;

        assert_eq!(actual, expected);
    }

    #[test]
    fn test_abs() {
        let decimal = Decimal::new(0, 0, false);
        assert_eq!(decimal.abs(), 0);

        let decimal = Decimal::new(42, 0, false);
        assert_eq!(decimal.abs(), 42);

        let decimal = Decimal::new(4269420, 5, false);
        assert_eq!(decimal.abs(), 42);

        let decimal = Decimal::new(4269420, 5, true);
        assert_eq!(decimal.abs(), 42);

        let decimal = Decimal::new(4269420, 5, false);
        assert_eq!(decimal.abs_up(), 43);

        let decimal = Decimal::new(4269420, 5, true);
        assert_eq!(decimal.abs_up(), 43);
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

            assert_eq!(actual, expected);
        }

        {
            // test: 2 + 2 = 4
            let a = Decimal::new(2, 0, false);
            let b = Decimal::new(2, 0, false);

            let expected = Decimal::new(4, 0, false);

            assert_eq!(a.add(b).unwrap(), expected);
        }

        {
            // test: -2 + (-2) = -4
            let a = Decimal::new(2, 0, true);
            let b = Decimal::new(2, 0, true);

            let expected = Decimal::new(4, 0, true);

            assert_eq!(a.add(b).unwrap(), expected);
        }

        {
            // test: 4 + (-3) = +1
            let a = Decimal::new(4, 0, false);
            let b = Decimal::new(3, 0, true);

            let expected = Decimal::new(1, 0, false);

            assert_eq!(a.add(b).unwrap(), expected);
        }

        {
            // test: 2 + (-5) = -3;
            let a = Decimal::new(2, 0, false);
            let b = Decimal::new(5, 0, true);

            let expected = Decimal::new(3, 0, true);

            assert_eq!(a.add(b).unwrap(), expected);
        }

        {
            // test -4 + 3 = -1
            let a = Decimal::new(4, 0, true);
            let b = Decimal::new(3, 0, false);

            let expected = Decimal::new(1, 0, true);

            assert_eq!(a.add(b).unwrap(), expected);
        }

        {
            // test: -2 + 5 = 3
            let a = Decimal::new(2, 0, true);
            let b = Decimal::new(5, 0, false);

            let expected = Decimal::new(3, 0, false);

            assert_eq!(a.add(b).unwrap(), expected);
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

            assert_eq!(actual, expected);
        }

        {
            // test: 10 - 15 = -5
            let a = Decimal::new(10, 6, false);
            let b = Decimal::new(15, 6, false);

            let expected = Decimal::new(5, 6, true);

            assert_eq!(a.sub(b).unwrap(), expected);
        }

        {
            // test: 15 - 10 = 5
            let a = Decimal::new(15, 6, false);
            let b = Decimal::new(10, 6, false);

            let expected = Decimal::new(5, 6, false);

            assert_eq!(a.sub(b).unwrap(), expected);
        }

        {
            // test: -10 - (-15) = 5
            let a = Decimal::new(10, 6, true);
            let b = Decimal::new(15, 6, true);

            let expected = Decimal::new(5, 6, false);

            assert_eq!(a.sub(b).unwrap(), expected);
        }

        {
            // test: -10 - (-5) = -5
            let a = Decimal::new(10, 6, true);
            let b = Decimal::new(5, 6, true);

            let expected = Decimal::new(5, 6, true);

            assert_eq!(a.sub(b).unwrap(), expected);
        }

        {
            // test: -10 - 15 = -25
            let a = Decimal::new(10, 6, true);
            let b = Decimal::new(15, 6, false);

            let expected = Decimal::new(25, 6, true);

            assert_eq!(a.sub(b).unwrap(), expected);
        }

        {
            // test: 10 - (-15) = 25
            let a = Decimal::new(10, 6, false);
            let b = Decimal::new(15, 6, true);

            let expected = Decimal::new(25, 6, false);

            assert_eq!(a.sub(b).unwrap(), expected);
        }

        {
            // test: 0 - 15 = -15
            let a = Decimal::new(0, 6, false);
            let b = Decimal::new(15, 6, false);

            let expected = Decimal::new(15, 6, true);

            assert_eq!(a.sub(b).unwrap(), expected);
        }

        {
            // test: 0 - (-15) = 15
            let a = Decimal::new(0, 6, false);
            let b = Decimal::new(15, 6, true);

            let expected = Decimal::new(15, 6, false);

            assert_eq!(a.sub(b).unwrap(), expected);
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
    fn test_into_string() {
        {
            let decimal = Decimal::from_u128(42);
            assert_eq!(decimal.to_string(), "42");
        }

        {
            let decimal = Decimal::new(42, 0, true);
            assert_eq!(decimal.to_string(), "-42");
        }

        {
            let decimal = Decimal::from_scaled_amount(0, 6);
            assert_eq!(decimal.to_string(), "0.000000");
        }

        {
            let decimal = Decimal::from_scaled_amount(1_500_000, 6);
            assert_eq!(decimal.to_string(), "1.500000");
        }

        {
            let decimal = Decimal::from_scaled_amount(500_000, 6);
            assert_eq!(decimal.to_string(), "0.500000");
        }

        {
            let decimal = Decimal::new(500_000, 6, true);
            assert_eq!(decimal.to_string(), "-0.500000");
        }
    }

    #[test]
    fn test_from_string() {
        {
            let actual = Decimal::from_str("1e6").unwrap();
            let expected = Decimal::new(1_000_000_000_000, 6, false);
            assert_eq!(actual, expected);
        }

        {
            let actual = Decimal::from_str("1.5e6").unwrap();
            let expected = Decimal::new(1_500_000_000_000, 6, false);
            assert_eq!(actual, expected);
        }

        {
            let actual = Decimal::from_str("-1.5e6").unwrap();
            let expected = Decimal::new(1_500_000_000_000, 6, true);
            assert_eq!(actual, expected);
        }

        {
            let actual = Decimal::from_str("1.5e9").unwrap();
            let expected = Decimal::new(1_500_000_000_000_000_000, 9, false);
            assert_eq!(actual, expected);
        }

        {
            let actual = Decimal::from_str("42").unwrap();
            let expected = Decimal::new(42, 0, false);
            assert_eq!(actual, expected);
        }

        {
            let actual = Decimal::from_str("-42").unwrap();
            let expected = Decimal::new(42, 0, true);
            assert_eq!(actual, expected);
        }

        {
            let actual = Decimal::from_str("1.5").unwrap();
            let expected = Decimal::new(15, 1, false);
            assert_eq!(actual, expected);
        }

        {
            let actual = Decimal::from_str("-1.5").unwrap();
            let expected = Decimal::new(15, 1, true);
            assert_eq!(actual, expected);
        }

        {
            let actual = Decimal::from_str("42.500000").unwrap();
            let expected = Decimal::new(42_500_000, 6, false);
            assert_eq!(actual, expected);
        }

        {
            let actual = Decimal::from_str("42.500420").unwrap();
            let expected = Decimal::new(42_500_420, 6, false);
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

        {
            let decimal = Decimal::new(42, 0, true);
            let other = Decimal::new(42, 0, true);
            let actual = decimal.lte(other).unwrap();
            let expected = true;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(42, 0, false);
            let other = Decimal::new(42, 0, true);
            let actual = decimal.lte(other).unwrap();
            let expected = false;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(42, 0, true);
            let other = Decimal::new(42, 0, false);
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

        {
            let decimal = Decimal::new(43, 0, true);
            let other = Decimal::new(42, 0, true);
            let actual = decimal.lt(other).unwrap();
            let expected = true;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(43, 0, false);
            let other = Decimal::new(42, 0, true);
            let actual = decimal.lt(other).unwrap();
            let expected = false;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(43, 0, true);
            let other = Decimal::new(42, 0, false);
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

        {
            let decimal = Decimal::new(43, 0, true);
            let other = Decimal::new(42, 0, true);
            let actual = decimal.gt(other).unwrap();
            let expected = false;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(43, 0, false);
            let other = Decimal::new(42, 0, true);
            let actual = decimal.gt(other).unwrap();
            let expected = true;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(43, 0, true);
            let other = Decimal::new(42, 0, false);
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

        {
            let decimal = Decimal::new(42, 0, true);
            let other = Decimal::new(42, 0, true);
            let actual = decimal.gte(other).unwrap();
            let expected = true;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(42, 0, false);
            let other = Decimal::new(42, 0, true);
            let actual = decimal.gte(other).unwrap();
            let expected = true;

            assert_eq!(actual, expected);
        }

        {
            let decimal = Decimal::new(42, 0, true);
            let other = Decimal::new(42, 0, false);
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

        {
            let decimal = Decimal::new(33, 4, false);
            let other = Decimal::new(33, 4, true);
            let actual = decimal.eq(other).unwrap();
            let expected = false;

            assert_eq!(actual, expected);
        }
    }

    #[test]
    fn test_min_max() {
        {
            let decimal = Decimal::new(10, 2, false);
            let other = Decimal::new(11, 2, false);
            let result = decimal.min(other);

            assert_eq!(decimal, result);
        }

        {
            let decimal = Decimal::new(10, 2, false);
            let other = Decimal::new(11, 2, false);
            let result = decimal.max(other);

            assert_eq!(other, result);
        }

        {
            let decimal = Decimal::new(10, 2, false);
            let other = Decimal::new(11, 2, true);
            let result = decimal.min(other);

            assert_eq!(other, result);
        }

        {
            let decimal = Decimal::new(10, 2, false);
            let other = Decimal::new(11, 2, true);
            let result = decimal.max(other);

            assert_eq!(decimal, result);
        }
    }

    #[test]
    fn test_neg() {
        // when zero
        {
            let decimal = Decimal::new(0, 0, false);
            assert_eq!(decimal.neg().is_negative(), false);
        }

        // when positive
        {
            let decimal = Decimal::new(42, 4, false);
            assert_eq!(decimal.neg().is_negative(), true);
        }

        // when negative
        {
            let decimal = Decimal::new(42, 4, true);
            assert_eq!(decimal.neg().is_negative(), false);
        }
    }

    #[test]
    fn test_sign() {
        // is zero
        {
            let decimal = Decimal::new(0, 0, false);
            assert_eq!(decimal.is_zero(), true);
        }

        // is positive
        {
            let decimal = Decimal::new(42, 4, false);
            assert_eq!(decimal.is_positive(), true);

            let decimal = Decimal::new(0, 0, false);
            assert_eq!(decimal.is_positive(), false);

            let decimal = Decimal::new(24, 4, true);
            assert_eq!(decimal.is_positive(), false);
        }

        // is negative
        {
            let decimal = Decimal::new(42, 4, false);
            assert_eq!(decimal.is_negative(), false);

            let decimal = Decimal::new(0, 0, false);
            assert_eq!(decimal.is_negative(), false);

            let decimal = Decimal::new(24, 4, true);
            assert_eq!(decimal.is_negative(), true);
        }
    }

    #[test]
    fn test_is_integer() {
        let decimal = Decimal::new(0, 0, false);
        assert_eq!(decimal.is_integer(), true);

        let decimal = Decimal::new(42, 0, false);
        assert_eq!(decimal.is_integer(), true);

        let decimal = Decimal::new(42, 0, true);
        assert_eq!(decimal.is_integer(), true);

        let decimal = Decimal::new(42420, 3, false);
        assert_eq!(decimal.is_integer(), false);

        let decimal = Decimal::new(42420, 3, true);
        assert_eq!(decimal.is_integer(), false);
    }

    #[test]
    fn test_pow_with_integer_exp() {
        // 0**n = 0
        {
            let scale: u8 = 6;
            let base = Decimal::new(0, scale, false);
            let exp: u128 = 100;
            let result = base.pow(exp);
            let expected = Decimal::new(0, scale, false);
            assert_eq!(result, expected);
        }

        // n**0 = 1
        let scale: u8 = 6;
        let base = Decimal::from_u64(10).to_scale(scale);
        let exp: u128 = 0;
        let result = base.pow(exp);
        let expected = Decimal::from_u64(1).to_scale(scale);
        assert_eq!(result, expected);

        // 2**18 = 262,144
        {
            let scale: u8 = 6;
            let base = Decimal::from_u64(2).to_scale(scale);
            let exp: u128 = 18;
            let result = base.pow(exp);
            let expected = Decimal::from_u64(262_144).to_scale(scale);
            assert_eq!(result, expected);
        }

        // 3.41200000**8 = 18368.43602322
        {
            let base = Decimal::new(3_41200000, 8, false);
            let exp: u128 = 8;
            let result = base.pow(exp);
            let expected = Decimal::new(18368_43602280, 8, false);
            assert_eq!(result, expected);
        }
    }

    #[test]
    fn test_pow_with_decimal_exp() {
        // 42^-0.25 = 0.3928146509
        let base = Decimal::new(42_000000, 6, false);
        let exp = Decimal::new(250000, 6, true);
        let result = base.pow(exp);
        let expected = Decimal::new(392814, 6, false);
        assert_eq!(result, expected);

        // 42^-1 = 0.02380952381
        let base = Decimal::new(42_000000, 6, false);
        let exp = Decimal::new(1_000000, 6, true);
        let result = base.pow(exp);
        let expected = Decimal::new(23809, 6, false);
        assert_eq!(result, expected);

        // 42^0 = 1
        let base = Decimal::new(42_000000, 6, false);
        let exp = Decimal::new(0, 6, false);
        let result = base.pow(exp);
        let expected = Decimal::new(1_000000, 6, false);
        assert_eq!(result, expected);

        // 42^0.25 = 2.545729895021831
        let base = Decimal::new(42_000000000000, 12, false);
        let exp = Decimal::new(250000000000, 12, false);
        let result = base.pow(exp);
        let expected = Decimal::new(2_545_729_895_021u128, 12, false);
        assert_eq!(result, expected);

        // 42^0.5 = 6.48074069840786
        let base = Decimal::new(42_000000000000, 12, false);
        let exp = Decimal::new(500000000000, 12, false);
        let result = base.pow(exp);
        let expected = Decimal::new(6_480_740_698_407u128, 12, false);
        assert_eq!(result, expected);

        // 42^1 = 42
        let base = Decimal::new(42_000000000000, 12, false);
        let exp = Decimal::new(1000000000000, 12, false);
        let result = base.pow(exp);
        let expected = Decimal::new(42_000000000000u128, 12, false);
        assert_eq!(result, expected);

        // 42^1.25 = 106.920655590916882
        let base = Decimal::new(42_000000000000, 12, false);
        let exp = Decimal::new(1250000000000, 12, false);
        let result = base.pow(exp);
        let expected = Decimal::new(106_920_655_590_882u128, 12, false);
        assert_eq!(result, expected);

        // 42^1.5 = 272.19110933313013
        let base = Decimal::new(42_000000000000, 12, false);
        let exp = Decimal::new(1500000000000, 12, false);
        let result = base.pow(exp);
        let expected = Decimal::new(272_191_109_333_094, 12, false);
        assert_eq!(result, expected);

        // 42^2 = 1764
        let base = Decimal::new(42_000000000000, 12, false);
        let exp = Decimal::new(2000000000000, 12, false);
        let result = base.pow(exp);
        let expected = Decimal::new(1764_000000000000u128, 12, false);
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
        let n = Decimal::from_u64(0).to_compute_scale();
        let result = n.sqrt().unwrap();
        let expected = Decimal::from_u64(0).to_compute_scale();
        assert_eq!(result, expected);

        // 1**0.5 = 1
        let n = Decimal::from_u64(1).to_compute_scale();
        let result = n.sqrt().unwrap();
        let expected = Decimal::from_u64(1).to_compute_scale();
        assert_eq!(result, expected);

        // 2**0.5 = 1.414213562373
        let n = Decimal::from_u64(2).to_compute_scale();
        let result = n.sqrt().unwrap();
        let expected = Decimal::new(1_414_213_562_373u128, 12, false);
        assert_eq!(result, expected);

        // 3**0.5 = 1.7320508076
        let n = Decimal::from_u64(3).to_compute_scale();
        let result = n.sqrt().unwrap();
        let expected = Decimal::new(1_732_050_807_568u128, 12, false);
        assert_eq!(result, expected);

        // 4**0.5 = 2
        let n = Decimal::from_u64(4).to_compute_scale();
        let result = n.sqrt().unwrap();
        let expected = Decimal::from_u64(2).to_compute_scale();
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
            // ln(.93859063) = -0.06337585862

            let expected = Decimal {
                value: 6337585,
                scale: 8,
                negative: true,
            };

            let n = Decimal::new(93859063, 8, false);
            let actual = n.ln().unwrap();

            assert_eq!(actual.value, expected.value);
            assert_eq!(actual.negative, expected.negative);
            assert_eq!(actual.scale, expected.scale);
        }

        {
            // ln(0.9) = -0.105_360

            let expected = Decimal {
                value: 105_360u128,
                scale: 6,
                negative: true,
            };

            let n = Decimal::new(900_000u128, 6, false);
            let actual = n.ln().unwrap();

            assert_eq!(actual.value, expected.value);
            assert_eq!(actual.negative, expected.negative);
            assert_eq!(actual.scale, expected.scale);
        }

        {
            // ln(0.9) = -0.105_360_515_657

            let expected = Decimal {
                value: 105_360_515_657u128,
                scale: 12,
                negative: true,
            };

            let n = Decimal::new(900_000_000_000u128, 12, false);
            let actual = n.ln().unwrap();

            assert_eq!(actual.value, expected.value);
            assert_eq!(actual.negative, expected.negative);
            assert_eq!(actual.scale, expected.scale);
        }

        {
            // ln(0.1) = -2.302_585_092_994

            let expected = Decimal {
                value: 2_302_585_092_991u128,
                scale: 12,
                negative: true,
            };

            let n = Decimal::new(100_000_000_000u128, 12, false);
            let actual = n.ln().unwrap();

            assert_eq!(actual.value, expected.value);
            assert_eq!(actual.negative, expected.negative);
            assert_eq!(actual.scale, expected.scale);
        }

        {
            // ln(10) = 2.302_585_092_987

            let expected = Decimal {
                value: 2_302_585_092_924u128,
                scale: 12,
                negative: false,
            };

            let n = Decimal::from_u64(10).to_compute_scale();
            let actual = n.ln().unwrap();

            assert_eq!({ actual.value }, { expected.value });
            assert_eq!(actual.scale, expected.scale);
        }

        // MAX u64
        // TODO: work on accuracy at high end of u64 range
        // {
        //     // ln(18446744073709551615) = 44.36141956
        //     let expected = Decimal {
        //         value: 44_36141956u128,
        //         scale: 6,
        //         negative: false,
        //     };
        //
        //     let n = Decimal::from_amount(u64::MAX);
        //     let actual = n.ln().unwrap();
        //
        //     assert_eq!({ actual.value }, { expected.value });
        //     assert_eq!(actual.scale, expected.scale);
        // }
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

    #[test]
    fn test_bit_length() {
        // 0 bit length == 0
        let d = Decimal::new(0, 0, false);
        assert_eq!(d.bit_length().unwrap(), Decimal::new(0, 0, false));

        // 10 bit length == 3
        let d = Decimal::new(10, 0, false);
        assert_eq!(d.bit_length().unwrap(), Decimal::new(3, 0, false));

        // 0.900000 bit length == -1
        let d = Decimal::new(900_000, 6, false);
        assert_eq!(d.bit_length().unwrap(), Decimal::new(1, 0, true));

        // 0.01 bit length == -7
        let d = Decimal::new(1, 2, false);
        assert_eq!(d.bit_length().unwrap(), Decimal::new(7, 0, true));

        // 0.000001 bit length == -20
        let d = Decimal::new(1, 6, false);
        assert_eq!(d.bit_length().unwrap(), Decimal::new(20, 0, true));

        // 18446744073709551615 bit length == 64
        let d = Decimal::from_u64(u64::MAX);
        assert_eq!(d.bit_length().unwrap(), Decimal::new(64, 0, false));
    }

    #[test]
    #[should_panic]
    fn test_bit_length_panic() {
        let d = Decimal::new(10, 0, true);
        assert_eq!(d.bit_length().unwrap(), Decimal::new(3, 0, false));
    }
}
