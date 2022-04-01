//! Math functions

use ndarray::{arr2, Array2};
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

/// Natural log table for each decimal place
pub fn log_table(row: usize, col: usize) -> PreciseNumber {
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
        ],
    ]);

    PreciseNumber {
        value: InnerUint::from(table[[row, col]]),
    }
}

/// Return value from natural log table for a given index (power of 10)
pub fn log_table_value(
    s_value: &PreciseNumber,
    t_value: &PreciseNumber,
    log_table_col: usize,
) -> (PreciseNumber, PreciseNumber, PreciseNumber) {
    let s_value = s_value.checked_div(&t_value).unwrap();
    let place_value = 10u128.checked_pow((log_table_col + 1) as u32).unwrap();
    let f_value = PreciseNumber::new(place_value).unwrap();
    let t_value = s_value
        .checked_mul(&f_value)
        .unwrap()
        .floor()
        .unwrap()
        .checked_div(&f_value)
        .unwrap();

    let log_table_row = t_value
        .checked_mul(&f_value)
        .unwrap()
        .checked_sub(&f_value)
        .unwrap();

    let mut lx_value = PreciseNumber::new(0u128).unwrap();

    if log_table_row.greater_than(&PreciseNumber::new(0u128).unwrap()) {
        lx_value = log_table(
            log_table_row.to_imprecise().unwrap() as usize - 1,
            log_table_col,
        );
    }

    (s_value, t_value, lx_value)
}

/// Return the natural log of a precise number using log tables
/// Refer to algorithm here:
/// https://docs.google.com/spreadsheets/d/19mgYjGQlpsuaTk1zXujn-yCSdbAL25sP/edit?pli=1#gid=2070648638
pub fn ln(value: &PreciseNumber) -> Option<PreciseNumber> {
    let length = (128u32 - value.to_imprecise().unwrap().leading_zeros()) - 1;
    let max = PreciseNumber::new(1u128 << length).unwrap();

    let (s_0, t_0, lx_0) = log_table_value(&value, &max, 0);
    let (s_1, t_1, lx_1) = log_table_value(&s_0, &t_0, 1);
    let (s_2, t_2, lx_2) = log_table_value(&s_1, &t_1, 2);
    let (s_3, t_3, lx_3) = log_table_value(&s_2, &t_2, 3);
    let (s_4, t_4, lx_4) = log_table_value(&s_3, &t_3, 4);
    let (s_5, t_5, lx_5) = log_table_value(&s_4, &t_4, 5);
    let (s_6, t_6, lx_6) = log_table_value(&s_5, &t_5, 6);
    let (s_7, t_7, lx_7) = log_table_value(&s_6, &t_6, 7);
    let (s_8, t_8, lx_8) = log_table_value(&s_7, &t_7, 8);
    let (_s_9, _t_9, lx_9) = log_table_value(&s_8, &t_8, 9);

    let ln_2 = PreciseNumber {
        value: InnerUint::from(693147180559u128),
    };

    ln_2.checked_mul(&PreciseNumber::new(length as u128).unwrap())
        .unwrap()
        .checked_add(&lx_0)
        .unwrap()
        .checked_add(&lx_1)
        .unwrap()
        .checked_add(&lx_2)
        .unwrap()
        .checked_add(&lx_3)
        .unwrap()
        .checked_add(&lx_4)
        .unwrap()
        .checked_add(&lx_5)
        .unwrap()
        .checked_add(&lx_6)
        .unwrap()
        .checked_add(&lx_7)
        .unwrap()
        .checked_add(&lx_8)
        .unwrap()
        .checked_add(&lx_9)
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
        }
        2 => {
            // x^1/2 = x^0.5 = √x = sqrt(x)
            sqrt_precise(base).unwrap()
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
