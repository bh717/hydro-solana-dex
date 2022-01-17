//! Math functions

use spl_math::precise_number::PreciseNumber;
use spl_math::uint::U256;
type InnerUint = U256;

/// The number 0 as a precise number
fn zero() -> PreciseNumber {
    PreciseNumber::new(0).expect("one")
}

/// The number 1 as a precise number
fn one() -> PreciseNumber {
    PreciseNumber::new(1).expect("one")
}

/// The number 2 as a precise number
fn two() -> PreciseNumber {
    PreciseNumber::new(2).expect("two")
}

/// Return the number of bits necessary to represent the integer s in binary excluding
/// the sign and leading zeroes.
fn bit_length(s: u128) -> u32 {
    let mut high = 128u32;
    let mut low = 0u32;
    let mut mid = (high + low) >> 1;
    loop {
        let remind = s >> mid;
        if remind > 1 {
            low = mid;
            mid = (low + high) >> 1;
            continue;
        }
        if remind == 1 {
            return mid + 1;
        }
        if remind < 1 {
            high = mid;
            mid = (low + high) >> 1;
            continue;
        }
    }
}

/// Return the square root of a number
pub fn sqrt(s: u128) -> u128 {
    if s == 0u128 || s == 1 {
        return s;
    }
    let mid_length = bit_length(s) >> 1;
    let approximate = 1u128 << mid_length;
    let mut y = s.checked_div(approximate).unwrap();
    let mut y_0 = 0u128;
    let throld = 1u128;
    loop {
        if y.gt(&y_0) && y.checked_sub(y_0).unwrap().gt(&throld) {
            let tmp_y = s.checked_div(y).unwrap();
            y_0 = y;
            y = y.checked_add(tmp_y).unwrap();
            y = y >> 1;
        } else if y.lt(&y_0) && y_0.checked_sub(y).unwrap().gt(&throld) {
            let tmp_y = s.checked_div(y).unwrap();
            y_0 = y;
            y = y.checked_add(tmp_y).unwrap();
            y = y >> 1;
        } else {
            break;
        }
    }
    return y;
}

/// Based on testing around the limits, this base is the smallest value that
/// provides an epsilon 11 digits
fn minimum_sqrt_base() -> PreciseNumber {
    PreciseNumber {
        value: InnerUint::from(0),
    }
}

/// Based on testing around the limits, this base is the smallest value that
/// provides an epsilon of 11 digits
fn maximum_sqrt_base() -> PreciseNumber {
    PreciseNumber::new(std::u128::MAX).unwrap()
}

/// Return the square root of a precise number
pub fn sqrt_precise(s: &PreciseNumber) -> Option<PreciseNumber> {
    if s.less_than(&minimum_sqrt_base()) || s.greater_than(&maximum_sqrt_base()) {
        return None;
    }

    if s.eq(&zero()) || s.eq(&one()) {
        return Some(s.clone());
    }

    let scale_out = PreciseNumber::new(1_000_000_000_000).unwrap();
    let s_scaled = s.checked_mul(&scale_out).expect("s_scaled");
    let bit_length = 256u32 - s_scaled.value.leading_zeros();
    let mid_length = bit_length.checked_div(2).expect("mid_length");
    let approx = 2u128.checked_pow(mid_length).expect("approx");
    let approx_precise = PreciseNumber::new(approx).expect("approx_precise");
    let mut y = s_scaled.checked_div(&approx_precise).expect("y");
    let mut y_0 = zero();
    let threshold = PreciseNumber {
        value: InnerUint::from(1u128),
    };

    loop {
        if y.greater_than(&y_0) && y.checked_sub(&y_0).unwrap().greater_than(&threshold) {
            let tmp_y = PreciseNumber {
                value: s_scaled.value.checked_div(y.value).expect("tmp_y"),
            };
            y_0 = y.clone();
            y = y
                .clone()
                .checked_add(&tmp_y)
                .unwrap()
                .checked_div(&two())
                .expect("y_condition_1");
        } else if y.less_than(&y_0) && y_0.checked_sub(&y).unwrap().greater_than(&threshold) {
            let tmp_y = PreciseNumber {
                value: s_scaled.value.checked_div(y.value).unwrap(),
            };
            y_0 = y.clone();
            y = y
                .clone()
                .checked_add(&tmp_y)
                .unwrap()
                .checked_div(&two())
                .expect("y_condition_2");
        } else {
            break;
        }
    }
    return Some(y);
}

/// Return the natural log of a number
pub fn log(s: u128) -> PreciseNumber {
    let log_arr_1: [u32; 10] = [
        0, 9531017, 18232155, 26236426, 33647223, 40546510, 47000362, 53062825, 58778666, 64185388,
    ];
    let log_arr_2: [u32; 10] = [
        0, 995033, 1980262, 2955880, 3922071, 4879016, 5826890, 6765864, 7696104, 8617769,
    ];
    let log_arr_3: [u32; 10] = [
        0, 99950, 199800, 299550, 399202, 498754, 598207, 697561, 796816, 895974,
    ];
    let log_arr_4: [u32; 10] = [
        0, 9999, 19998, 29995, 39992, 49987, 59982, 69975, 79968, 89959,
    ];
    let log_arr_5: [u32; 10] = [0, 999, 1999, 2999, 3999, 4999, 5999, 6999, 7999, 8999];
    let log_arr_6: [u32; 10] = [0, 99, 199, 299, 399, 499, 599, 699, 799, 899];
    let multiply = PreciseNumber::new(100000000u128).unwrap();
    let length = bit_length(s) - 1;
    let approximate = 1u128 << length;
    let s_mul_100000000 = s.checked_mul(100000000u128).expect("log_s_mul_100000000");
    let s0 = s_mul_100000000 / approximate;
    let s1 = s0 * 10 / (s0 / 10000000);
    let index_1 = (s0 / 10000000 - 10) as usize;
    let s2 = s1 * 100 / (s1 / 1000000);
    let index_2 = (s1 / 1000000 - 100) as usize;
    let s3 = s2 * 1000 / (s2 / 100000);
    let index_3 = (s2 / 100000 - 1000) as usize;
    let s4 = s3 * 10000 / (s3 / 10000);
    let index_4 = (s3 / 10000 - 10000) as usize;
    let s5 = s4 * 100000 / (s4 / 1000);
    let index_5 = (s4 / 1000 - 100000) as usize;
    let index_6 = (s5 / 100 - 1000000) as usize;
    let lnx1 = log_arr_1[index_1] as u128;
    let lnx2 = log_arr_2[index_2] as u128;
    let lnx3 = log_arr_3[index_3] as u128;
    let lnx4 = log_arr_4[index_4] as u128;
    let lnx5 = log_arr_5[index_5] as u128;
    let lnx6 = log_arr_6[index_6] as u128;
    let lnn2 = 69314718 * (length as u128);
    let tmp_result = lnn2 + lnx1 + lnx2 + lnx3 + lnx4 + lnx5 + lnx6;
    let result = PreciseNumber::new(tmp_result)
        .unwrap()
        .checked_div(&multiply)
        .unwrap();
    return result;
}

/// Compute power of base given exponent in 0.25 increments
pub fn checked_pow_fraction(base: &PreciseNumber, exp: &PreciseNumber) -> PreciseNumber {
    let divisor = PreciseNumber::new(1)
        .unwrap()
        .checked_div(&PreciseNumber::new(4).unwrap())
        .unwrap();

    let quotient = exp
        .checked_div(&divisor)
        .expect("quotient")
        .to_imprecise()
        .unwrap() as i32;

    // index of exponent/0.25
    match quotient {
        0 => {
            // x^0 = 1
            one()
        }
        1 => {
            // x^1/4 = x^0.25 = ⁴√x = √(√x) = sqrt(sqrt(x))
            sqrt_precise(&sqrt_precise(base).unwrap()).unwrap()
            // PreciseNumber.sqrt uses less efficient newtonian method
            // (base.sqrt().unwrap()).sqrt().unwrap()
        }
        2 => {
            // x^1/2 = x^0.5 = √x = sqrt(x)
            sqrt_precise(base).unwrap()
            // PreciseNumber.sqrt uses less efficient newtonian method
            // base.sqrt().unwrap()
        }
        4 => {
            // x^1 = x
            base.clone()
        }
        5 => {
            // x^5/4 = x^1.25 = x(√(√x)) = x(sqrt(sqrt(x)))
            base.checked_mul(&(sqrt_precise(&sqrt_precise(base).unwrap()).unwrap()))
                .unwrap()
        }
        6 => {
            // x^3/2 = x^1.50 = x(√x) = x(sqrt(x))
            base.checked_mul(&sqrt_precise(base).unwrap()).unwrap()
            // PreciseNumber.sqrt uses less efficient newtonian method
            // base.checked_mul(&base.sqrt().unwrap()).unwrap()
        }
        8 => {
            // x^2 = 2x
            base.checked_mul(&base).unwrap()
        }
        _ => {
            assert!(
                false,
                "compute_pow not implemented for base: {} exponent: {}",
                base.value, exp.value
            );
            PreciseNumber::new(0u128).unwrap()
        }
    }
}

/// Signed addition of precise numbers
pub fn signed_addition(
    lhs: &PreciseNumber,
    lhs_signed: bool,
    rhs: &PreciseNumber,
    rhs_signed: bool,
) -> (PreciseNumber, bool) {
    if lhs_signed && rhs_signed {
        (lhs.checked_add(&rhs).expect("double_negative"), true)
    } else if lhs_signed && !rhs_signed {
        rhs.unsigned_sub(&lhs)
    } else if !lhs_signed && !rhs_signed {
        (lhs.checked_add(&rhs).expect("double positive"), false)
    } else {
        lhs.unsigned_sub(&rhs)
    }
}

/// Signed multiplication of precise numbers
pub fn signed_mul(
    lhs: &PreciseNumber,
    lhs_signed: bool,
    rhs: &PreciseNumber,
    rhs_signed: bool,
) -> (PreciseNumber, bool) {
    let result = lhs.checked_mul(&rhs).unwrap();
    let result_signed = !(lhs_signed == rhs_signed);
    (result, result_signed)
}
