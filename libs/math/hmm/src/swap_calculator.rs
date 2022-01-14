//! Swap calculator
use spl_math::precise_number::PreciseNumber;

use crate::math::{checked_pow_fraction, log, signed_addition, signed_mul};
use crate::swap_result::SwapResult;

/// The number 1 as a precise number
fn one() -> PreciseNumber {
    PreciseNumber::new(1).expect("one")
}

/// The number 2 as a precise number
fn two() -> PreciseNumber {
    PreciseNumber::new(2).expect("two")
}

/// The decimal number 0.5 as a precise number
fn half() -> PreciseNumber {
    one().checked_div(&two()).expect("half")
}

/// Swap calculator input parameters
pub struct SwapCalculator {
    /// Number of tokens x currently in liquidity pool
    x0: PreciseNumber,
    /// Number of tokens y currently in liquidity pool
    y0: PreciseNumber,
    /// Compensation parameter c
    c: PreciseNumber,
    /// Oracle price relative to x
    i: PreciseNumber,
}

impl SwapCalculator {
    /// Create a new token swap calculator
    pub fn new(x0: u128, y0: u128, c: u128, i: u128) -> Self {
        Self {
            x0: PreciseNumber::new(x0).unwrap(),
            y0: PreciseNumber::new(y0).unwrap(),
            c: PreciseNumber::new(c).unwrap(),
            i: PreciseNumber::new(i).unwrap(),
        }
    }

    /// Compute swap result from x to y using a constant product curve given delta x
    pub fn swap_x_to_y_amm(&self, delta_x: u128) -> SwapResult {
        let delta_x = PreciseNumber::new(delta_x).unwrap();
        // k = x0 * y0
        let k = self.compute_k();

        // x_new = x0 + deltaX
        let x_new = self.compute_x_new(&delta_x);

        // y_new = k/x_new
        let y_new = k.checked_div(&x_new).expect("k/x_new");

        // delta_x = x_new - x0
        let delta_x = x_new.checked_sub(&self.x0).expect("x_new - x0");

        // delta_y = y0 - n_new
        let delta_y = self.y0.checked_sub(&y_new).expect("y0 - n_new");

        SwapResult {
            k,
            x_new,
            y_new,
            delta_x,
            delta_y,
        }
    }

    /// Compute swap result from x to y using a constant product curve given delta x
    pub fn swap_x_to_y_hmm(&self, delta_x: u128) -> SwapResult {
        let delta_x = PreciseNumber::new(delta_x).unwrap();
        let k = self.compute_k();
        let x_new = self.compute_x_new(&delta_x);
        let (delta_y, delta_y_signed) = self.compute_delta_y_hmm(&delta_x);
        let (y_new, _negative) = signed_addition(&self.y0, false, &delta_y, delta_y_signed);

        SwapResult {
            k,
            x_new,
            y_new,
            delta_x,
            delta_y,
        }
    }

    /// Compute delta y using a constant product curve given delta x
    fn compute_delta_y_amm(&self, delta_x: &PreciseNumber) -> (PreciseNumber, bool) {
        // Δy = K/(X₀ + Δx) - K/X₀
        // delta_y = k/(self.x0 + delta_x) - k/self.x0
        let k = self.compute_k();
        let x_new = self.compute_x_new(&delta_x);

        k.checked_div(&x_new)
            .expect("k/(self.x0 + delta_x)")
            .unsigned_sub(&(k.checked_div(&self.x0)).expect("k/self.x0"))
    }

    /// Compute delta x using a constant product curve given delta y
    pub fn compute_delta_x_amm(&self, delta_y: &PreciseNumber) -> (PreciseNumber, bool) {
        // Δx = K/(Y₀ + Δy) - K/Y₀
        // delta_x = k/(sef.y0 + delta_y) - k/self.y0
        let k = self.compute_k();
        let y_new = self.compute_y_new(&delta_y);

        k.checked_div(&y_new)
            .expect("k/(sef.y0 + delta_y)")
            .unsigned_sub(&(k.checked_div(&self.y0)).expect("k/self.y0"))
    }

    /// Compute delta y using a baseline curve given delta y
    fn compute_delta_y_hmm(&self, delta_x: &PreciseNumber) -> (PreciseNumber, bool) {
        let x_new = self.compute_x_new(delta_x);
        let xi = self.compute_xi();
        let k = self.compute_k();

        if x_new.greater_than(&self.x0) && self.x0.greater_than_or_equal(&xi) {
            // Condition 1
            // (Δx > 0 AND X₀ >= Xᵢ) [OR (Δx < 0 AND X₀ <= Xᵢ)] <= redundant because delta x always > 0
            // Oracle price is better than the constant product price.
            self.compute_delta_y_amm(delta_x)
        } else if x_new.greater_than(&self.x0) && x_new.less_than_or_equal(&xi) {
            // Condition 2
            // (Δx > 0 AND X_new <= Xᵢ) [OR (Δx < 0 AND X_new >= Xᵢ)]
            // Constant product price is better than the oracle price even after the full trade.
            self.compute_integral(&k, &self.x0, &x_new, &xi, &self.c)
        } else {
            // Condition 3
            // Constant product price is better than the oracle price at the start of the trade.
            // delta_y = compute_integral(k, x0, xi, xi, c) + (k/x_new - k/xi)
            let (integral, integral_signed) =
                self.compute_integral(&k, &self.x0, &xi, &xi, &self.c);

            // rhs = (k/x_new - k/xi)
            let k_div_x_new = k.checked_div(&x_new).unwrap();
            let k_div_xi = k.checked_div(&xi).unwrap();
            let (rhs, rhs_signed) = k_div_x_new.unsigned_sub(&k_div_xi);

            signed_addition(&integral, integral_signed, &rhs, rhs_signed)
        }
    }

    /// Compute delta x using a baseline curve given delta y
    pub fn compute_delta_x_hmm(&self, delta_y: &PreciseNumber) -> (PreciseNumber, bool) {
        let y_new = self.compute_y_new(delta_y);
        let yi = self.compute_yi();
        let k = self.compute_k();

        if y_new.greater_than(&self.y0) && self.y0.greater_than_or_equal(&yi) {
            // Condition 1
            // (Δy > 0 AND Y₀ >= Yᵢ) [OR (Δy < 0 AND Y₀ <= Yᵢ)] <= redundant because delta y always > 0
            // Oracle price is better than the constant product price.
            self.compute_delta_x_amm(delta_y)
        } else if y_new.greater_than(&self.y0) && y_new.less_than_or_equal(&yi) {
            // Condition 2
            // (Δy > 0 AND Y_new <= Yᵢ) [OR (Δy < 0 AND Y_new >= Yᵢ)] <= redundant because delta y always > 0
            // Constant product price is better than the oracle price even after the full trade.
            self.compute_integral(&k, &self.y0, &y_new, &yi, &self.c)
        } else {
            // Condition 3
            // Constant product price is better than the oracle price at the start of the trade.
            // delta_x = compute_integral(k, y0, yi, yi, c) + (k/x_new - k/xi)
            let (integral, integral_signed) =
                self.compute_integral(&k, &self.y0, &yi, &yi, &self.c);

            // rhs = (k/x_new - k/xi)
            let k_div_y_new = k.checked_div(&y_new).unwrap();
            let k_div_yi = k.checked_div(&yi).unwrap();
            let (rhs, rhs_signed) = k_div_y_new.unsigned_sub(&k_div_yi);

            signed_addition(&integral, integral_signed, &rhs, rhs_signed)
        }
    }

    /// Compute the integral with different coefficient values of c
    fn compute_integral(
        &self,
        k: &PreciseNumber,
        q0: &PreciseNumber,
        q_new: &PreciseNumber,
        qi: &PreciseNumber,
        c: &PreciseNumber,
    ) -> (PreciseNumber, bool) {
        if c == &one() {
            // k/qi * (q0/q_new).ln()
            let k_div_qi = k.checked_div(&qi).expect("k_div_qi");

            // log(q0) - log(q_new) is the alternate form of log(q0/q_new)
            // TODO: this is really inaccurate as we lose the decimal precision
            // let log_q0 = log(q0.to_imprecise().unwrap());
            // let log_q_new = log(q_new.to_imprecise().unwrap());
            // let (log_q0_sub_log_q_new, is_signed) = log_q0
            //     .unsigned_sub(&log_q_new);
            //
            // signed_mul(&k_div_qi, false, &log_q0_sub_log_q_new, is_signed)

            // using this instead: log(q0/q_new)
            // but also multiplying by a big number first: because log(a*b) = log(a)+ log(b)
            // so we are doing log(wanted) = log(wanted * factor) - log(factor)
            // that way we avoid doing the log of a small number
            let q0_div_q_new = q0.checked_div(q_new).expect("q0_div_q_new");
            let factor = PreciseNumber::new(1000u128).expect("factor");
            let q0_div_q_new_bumped = q0_div_q_new
                .checked_mul(&factor)
                .expect("q0_div_q_new_bumped");
            let log_q0_div_q_new_bumped = log(q0_div_q_new_bumped
                .to_imprecise()
                .expect("log_q0_div_q_new_bumped"));
            let log_factor = log(factor.to_imprecise().expect("log_factor"));
            let (log_q0_div_q_new, is_signed) = log_q0_div_q_new_bumped.unsigned_sub(&log_factor);
            signed_mul(&k_div_qi, false, &log_q0_div_q_new, is_signed)
        } else {
            // k/((qi**c)*(c-1)) * (q0**(c-1)-q_new**(c-1))
            // k/(qi**c)/(c-1) * (q0**(c-1)-q_new**(c-1))
            // (k*q0**(c-1) - k*q_new**(c-1)) /(qi**c)/(c-1)
            // a = k*q0**(c-1)
            // b = k*q_new**(c-1)
            // (a - b) / (qi**c) / (c-1)

            // c-1
            let (c_sub_one, c_sub_one_signed) = c.unsigned_sub(&one());
            // qi**c
            let qi_pow_c = checked_pow_fraction(qi, c);

            if c_sub_one_signed {
                // a = k*q0**(c-1)
                let k_div_q0_pow_c_sub_one: PreciseNumber;
                // b = k*q_new**(c-1)
                let k_div_q_new_pow_c_sub_one: PreciseNumber;
                k_div_q0_pow_c_sub_one = k
                    .checked_div(&(checked_pow_fraction(&q0, &c_sub_one)))
                    .expect("q0_pow_c_sub_one");
                k_div_q_new_pow_c_sub_one = k
                    .checked_div(&(checked_pow_fraction(&q_new, &c_sub_one)))
                    .expect("q_new_pow_c_sub_one");

                let (a_sub_b, _negative) = signed_addition(
                    &k_div_q0_pow_c_sub_one,
                    false,
                    &k_div_q_new_pow_c_sub_one,
                    true,
                );

                // (a - b) / (qi**c) / (c-1)
                let result = a_sub_b
                    .checked_div(&qi_pow_c)
                    .unwrap()
                    .checked_div(&c_sub_one)
                    .unwrap();
                (result, c_sub_one_signed)
            } else {
                // a = k*q0**(c-1)
                let q0_pow_c_sub_one: PreciseNumber;
                // b = k*q_new**(c-1)
                let q_new_pow_c_sub_one: PreciseNumber;
                // lhs = k/((qi**c)*(c-1))
                // (qi**c)*(c-1)
                let (lhs_den, lhs_signed) =
                    signed_mul(&qi_pow_c, false, &c_sub_one, c_sub_one_signed);
                let lhs = k.checked_div(&lhs_den).expect("lhs");

                // q0**(c-1)
                q0_pow_c_sub_one = checked_pow_fraction(q0, &c_sub_one);
                // q_new**(c-1)
                q_new_pow_c_sub_one = checked_pow_fraction(q_new, &c_sub_one);

                // rhs = q0**(c-1) - q_new**(c-1)
                let (rhs, rhs_signed) = q0_pow_c_sub_one.unsigned_sub(&q_new_pow_c_sub_one);

                // lhs * rhs
                signed_mul(&lhs, lhs_signed, &rhs, rhs_signed)
            }
        }
    }

    /// Compute constant product curve invariant k
    fn compute_k(&self) -> PreciseNumber {
        // k = x0 * y0
        self.x0.checked_mul(&self.y0).expect("compute_k")
    }

    /// Compute the token balance of x assuming the constant product price
    /// is the same as the oracle price.
    /// i = K/Xᵢ² ∴ Xᵢ = √K/i
    fn compute_xi(&self) -> PreciseNumber {
        // Xᵢ = √K/i
        let k = self.compute_k();
        let k_div_i = k.checked_div(&self.i).expect("k_div_i");
        // TODO: decide on using custom square root function, less compute but more inaccurate.
        // let k_div_i = k.checked_div(&self.i).expect("k/i").to_imprecise().unwrap();
        // PreciseNumber::new(sqrt(k_div_i)).expect("xi")
        checked_pow_fraction(&k_div_i, &half())
    }

    /// Compute the token balance of y assuming the constant product price
    /// is the same as the oracle price
    /// i = K/Yᵢ² ∴ Yᵢ = √(K/1/i) = √(K * i)
    fn compute_yi(&self) -> PreciseNumber {
        // Yᵢ = √(K/1/i) = √(K * i)
        let k = self.compute_k();
        let (k_mul_i, _negative) = signed_mul(&k, false, &self.i, false);
        checked_pow_fraction(&k_mul_i, &half())
    }

    /// Compute new amount for x
    fn compute_x_new(&self, delta_x: &PreciseNumber) -> PreciseNumber {
        // x_new = x0 + delta_x
        self.x0.checked_add(&delta_x).expect("compute_x_new")
    }

    /// Compute new amount for y
    fn compute_y_new(&self, delta_y: &PreciseNumber) -> PreciseNumber {
        // y_new = y0 + delta_y
        self.y0.checked_add(&delta_y).expect("compute_y_new")
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use std::collections::HashMap;

    use proptest::prelude::*;
    use spl_math::precise_number::PreciseNumber;
    use spl_math::uint::U256;

    use sim::Model;

    use super::*;

    type InnerUint = U256;

    fn desired_precision(c: &PreciseNumber) -> U256 {
        if c == &one() {
            InnerUint::from(1_000_000_000_000u128)
        } else {
            InnerUint::from(1_000u128)
        }
    }

    fn coefficient_allowed_values() -> HashMap<&'static str, (u128, u128, PreciseNumber)> {
        HashMap::from([
            ("0.0", (0, 0, PreciseNumber::new(0).unwrap())),
            ("1.0", (1, 1, PreciseNumber::new(1).unwrap())),
            (
                "1.25",
                (
                    5,
                    4,
                    PreciseNumber::new(5)
                        .unwrap()
                        .checked_div(&PreciseNumber::new(4).unwrap())
                        .unwrap(),
                ),
            ),
            (
                "1.5",
                (
                    3,
                    2,
                    PreciseNumber::new(3)
                        .unwrap()
                        .checked_div(&PreciseNumber::new(2).unwrap())
                        .unwrap(),
                ),
            ),
        ])
    }

    fn check_k(model: &Model, x0: u128, y0: u128) {
        let swap = SwapCalculator {
            x0: PreciseNumber::new(x0).unwrap(),
            y0: PreciseNumber::new(y0).unwrap(),
            c: PreciseNumber {
                value: Default::default(),
            },
            i: PreciseNumber {
                value: Default::default(),
            },
        };
        let result = swap.compute_k();
        let expected = model.sim_k();
        assert_eq!(result, expected, "check_k");
    }

    fn check_xi(model: &Model, x0: u128, y0: u128, i: u128) {
        let swap = SwapCalculator {
            x0: PreciseNumber::new(x0).unwrap(),
            y0: PreciseNumber::new(y0).unwrap(),
            c: PreciseNumber {
                value: Default::default(),
            },
            i: PreciseNumber::new(i).unwrap(),
        };
        let result = swap.compute_xi();
        let expected = model.sim_xi();
        assert_eq!(result, expected.0, "check_xi");
    }

    fn check_delta_y_amm(model: &Model, x0: u128, y0: u128, delta_x: u128) {
        let swap = SwapCalculator {
            x0: PreciseNumber::new(x0).unwrap(),
            y0: PreciseNumber::new(y0).unwrap(),
            c: PreciseNumber {
                value: Default::default(),
            },
            i: PreciseNumber {
                value: Default::default(),
            },
        };
        let result = swap.compute_delta_y_amm(&PreciseNumber::new(delta_x).unwrap());
        let expected = model.sim_delta_y_amm(delta_x);
        assert_eq!(result.0, expected.0, "check_delta_y_amm");
        assert_eq!(result.1, expected.1, "check_delta_y_amm signed")
    }

    fn check_swap_x_to_y_amm(model: &Model, x0: u128, y0: u128, delta_x: u128) {
        let swap = SwapCalculator {
            x0: PreciseNumber::new(x0).unwrap(),
            y0: PreciseNumber::new(y0).unwrap(),
            c: PreciseNumber {
                value: Default::default(),
            },
            i: PreciseNumber {
                value: Default::default(),
            },
        };
        let swap_x_to_y_amm = swap.swap_x_to_y_amm(delta_x);
        let expected = model.sim_swap_x_to_y_amm(delta_x);
        assert_eq!(
            swap_x_to_y_amm.x_new.to_imprecise().unwrap(),
            expected.0,
            "x_new"
        );
        assert_eq!(
            swap_x_to_y_amm.delta_x.to_imprecise().unwrap(),
            expected.1,
            "delta_x"
        );
        assert_eq!(
            swap_x_to_y_amm
                .y_new
                .floor()
                .unwrap()
                .to_imprecise()
                .unwrap(),
            expected.2,
            "y_new"
        );
        assert_eq!(
            swap_x_to_y_amm
                .delta_y
                .floor()
                .unwrap()
                .to_imprecise()
                .unwrap(),
            expected.3,
            "delta_y"
        );
    }

    fn check_delta_y_hmm(
        model: &Model,
        x0: u128,
        y0: u128,
        c: PreciseNumber,
        i: u128,
        delta_x: u128,
    ) {
        let swap = SwapCalculator {
            x0: PreciseNumber::new(x0).unwrap(),
            y0: PreciseNumber::new(y0).unwrap(),
            c,
            i: PreciseNumber::new(i).unwrap(),
        };
        let result = swap.compute_delta_y_hmm(&PreciseNumber::new(delta_x).unwrap());
        let expected = model.sim_delta_y_hmm(delta_x);

        assert!(
            result.0.almost_eq(&expected.0, desired_precision(&swap.c)),
            "check_delta_y_hmm result: {}, expected: {}, diff: {:?}",
            result.0.value,
            &expected.0.value,
            &expected.0.unsigned_sub(&result.0)
        );
        assert_eq!(result.1, expected.1, "check_delta_y_hmm signed")
    }

    fn check_delta_x_hmm(
        model: &Model,
        x0: u128,
        y0: u128,
        c: PreciseNumber,
        i: u128,
        delta_y: u128,
    ) {
        let swap = SwapCalculator {
            x0: PreciseNumber::new(x0).unwrap(),
            y0: PreciseNumber::new(y0).unwrap(),
            c,
            i: PreciseNumber::new(i).unwrap(),
        };
        let result = swap.compute_delta_x_hmm(&PreciseNumber::new(delta_y).unwrap());
        let expected = model.sim_delta_x_hmm(delta_y);

        assert!(
            result.0.almost_eq(&expected.0, desired_precision(&swap.c)),
            "check_delta_x_hmm result: {}, expected: {}, diff: {:?}",
            result.0.value,
            &expected.0.value,
            &expected.0.unsigned_sub(&result.0)
        );
        assert_eq!(result.1, expected.1, "check_delta_x_hmm signed")
    }

    proptest! {
        #[test]
        fn test_full_curve_math(
            x0 in 1..u128::MAX >> 64,
            y0 in 1..u128::MAX >> 64,
            c in (0..=3usize).prop_map(|v| ["0.0", "1.0", "1.25", "1.5"][v]),
            i in 1u128..=100u128,
            delta_x in 1u128..=10u128,
        ) {
            for (c_numer, c_denom, _c) in coefficient_allowed_values().get(c) {
                let model = Model::new(x0, y0, *c_numer, *c_denom, i);
                check_k(&model, x0, y0);
                check_xi(&model, x0, y0, i);
                check_delta_y_amm(&model, x0, y0, delta_x);
                check_swap_x_to_y_amm(&model, x0, y0, delta_x);
            }
        }
    }

    proptest! {
        #[test]
        fn test_partial_curve_math(
            x0 in 1..u128::MAX >> 120,
            y0 in 1..u128::MAX >> 120,
            c in (0..=3usize).prop_map(|v| ["0.0", "1.0", "1.25", "1.5"][v]),
            i in 1u128..=5u128,
            delta_x in 1u128..=5u128,
            delta_y in 1u128..=5u128,
        ) {
            for (c_numer, c_denom, c_precise) in coefficient_allowed_values().get(c) {
                let model = Model::new(x0, y0, *c_numer, *c_denom, i);
                check_delta_y_hmm(&model, x0, y0, c_precise.clone(), i, delta_x);
                check_delta_x_hmm(&model, x0, y0, c_precise.clone(), i, delta_y);
            }
        }
    }

    #[test]
    fn test_specific_curve_math() {
        // compute_delta_y_hmm when c == 1
        let swap = SwapCalculator {
            x0: PreciseNumber::new(37u128).unwrap(),
            y0: PreciseNumber::new(126u128).unwrap(),
            c: PreciseNumber::new(1u128).unwrap(),
            i: PreciseNumber::new(3u128).unwrap(),
        };
        let delta_x = PreciseNumber::new(3).unwrap();
        let (result, result_signed) = swap.compute_delta_y_hmm(&delta_x);

        let expected = PreciseNumber {
            value: InnerUint::from(9_207_401_794_786u128),
        };
        assert!(
            result.almost_eq(&expected, desired_precision(&swap.c)),
            "compute_delta_y_hmm {}, {}",
            result.value,
            &expected.value
        );
        assert_eq!(result_signed, true);

        // compute_delta_x_hmm when c == 0
        let swap = SwapCalculator {
            x0: PreciseNumber::new(216u128).unwrap(),
            y0: PreciseNumber::new(193u128).unwrap(),
            c: PreciseNumber::new(0u128).unwrap(),
            i: PreciseNumber::new(1u128).unwrap(),
        };
        let delta_y = PreciseNumber::new(4).unwrap();
        let (result, result_signed) = swap.compute_delta_x_hmm(&delta_y);

        let expected = PreciseNumber {
            value: InnerUint::from(4_385_786_802_030u128),
        };
        assert!(
            result.almost_eq(&expected, desired_precision(&swap.c)),
            "compute_delta_x_hmm {}, {}",
            result.value,
            &expected.value
        );
        assert_eq!(result_signed, true);

        // compute_delta_y_hmm when c == 1
        let swap = SwapCalculator {
            x0: PreciseNumber::new(32u128).unwrap(),
            y0: PreciseNumber::new(33u128).unwrap(),
            c: PreciseNumber::new(0u128).unwrap(),
            i: PreciseNumber::new(1u128).unwrap(),
        };
        let delta_x = PreciseNumber::new(1).unwrap();
        let (result, result_signed) = swap.compute_delta_y_hmm(&delta_x);

        let expected = PreciseNumber {
            value: InnerUint::from(1_000_000_000_000u128),
        };
        assert!(
            result.almost_eq(&expected, desired_precision(&swap.c)),
            "compute_delta_y_hmm {}, {}",
            result.value,
            &expected.value
        );
        assert_eq!(result_signed, true);

        // compute_delta_x_hmm when c == 0
        let swap = SwapCalculator {
            x0: PreciseNumber::new(1u128).unwrap(),
            y0: PreciseNumber::new(3u128).unwrap(),
            c: PreciseNumber::new(0u128).unwrap(),
            i: PreciseNumber::new(1u128).unwrap(),
        };
        let delta_y = PreciseNumber::new(1).unwrap();
        let (result, result_signed) = swap.compute_delta_x_hmm(&delta_y);

        let expected = PreciseNumber {
            value: InnerUint::from(250_000_000_000u128),
        };
        assert!(
            result.almost_eq(&expected, desired_precision(&swap.c)),
            "compute_delta_x_hmm {}, {}",
            result.value,
            &expected.value
        );
        assert_eq!(result_signed, true);

        // compute_delta_y_hmm when c == 1
        let swap = SwapCalculator {
            x0: PreciseNumber::new(1u128).unwrap(),
            y0: PreciseNumber::new(1u128).unwrap(),
            c: PreciseNumber::new(1u128).unwrap(),
            i: PreciseNumber::new(2u128).unwrap(),
        };
        let delta_x = PreciseNumber::new(1).unwrap();
        let (result, result_signed) = swap.compute_delta_y_hmm(&delta_x);

        let expected = PreciseNumber {
            value: InnerUint::from(500_000_000_000u128),
        };
        assert!(
            result.almost_eq(&expected, desired_precision(&swap.c)),
            "compute_delta_y_hmm {}, {}",
            result.value,
            &expected.value
        );
        assert_eq!(result_signed, true);

        // compute_delta_y_hmm when c == 0
        let swap = SwapCalculator {
            x0: PreciseNumber::new(1u128).unwrap(),
            y0: PreciseNumber::new(2u128).unwrap(),
            c: PreciseNumber::new(0u128).unwrap(),
            i: PreciseNumber::new(1u128).unwrap(),
        };
        let delta_x = PreciseNumber::new(1).unwrap();
        let (result, result_signed) = swap.compute_delta_y_hmm(&delta_x);

        let expected = PreciseNumber {
            value: InnerUint::from(1_000_000_000_000u128),
        };
        assert!(result.almost_eq(&expected, desired_precision(&swap.c)));
        assert_eq!(result_signed, true);

        // xi
        let swap = SwapCalculator {
            x0: PreciseNumber::new(1000u128).unwrap(),
            y0: PreciseNumber::new(1000u128).unwrap(),
            c: PreciseNumber {
                value: Default::default(),
            },
            i: PreciseNumber::new(200u128).unwrap(),
        };
        // ((1000*1000)/200)**0.5 = 70.710678118654752
        // https://www.wolframalpha.com/input/?i=%28%281000*1000%29%2F200%29**0.5
        let expected = PreciseNumber {
            value: InnerUint::from(70_710_678_118_654u128),
        };
        assert_eq!(swap.compute_xi(), expected, "xi specific");
    }
}
