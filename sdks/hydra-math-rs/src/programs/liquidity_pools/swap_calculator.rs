//! Swap calculator
use crate::decimal::{Add, Compare, Decimal, Div, Ln, Mul, Pow, Sqrt, Sub};
use crate::programs::liquidity_pools::swap_result::SwapResult;

/// Swap calculator input parameters
pub struct SwapCalculator {
    /// Number of tokens x currently in liquidity pool
    x0: Decimal,
    /// Number of tokens y currently in liquidity pool
    y0: Decimal,
    /// Compensation parameter c
    c: Decimal,
    /// Oracle price relative to x
    i: Decimal,
}

impl SwapCalculator {
    /// Create a new token swap calculator
    pub fn new(x0: u64, y0: u64, c: u64, i: u64) -> Self {
        Self {
            x0: Decimal::from_u64(x0),
            y0: Decimal::from_u64(y0),
            c: Decimal::from_u64(c),
            i: Decimal::from_u64(i),
        }
    }

    /// Compute swap result from x to y using a constant product curve given delta x
    pub fn swap_x_to_y_amm(&self, delta_x: u128) -> SwapResult {
        let delta_x = Decimal::from_u128(delta_x);

        // k = x0 * y0
        let k = self.compute_k();

        // x_new = x0 + deltaX
        let x_new = self.compute_x_new(&delta_x);

        // y_new = k/x_new
        let y_new = k.div(x_new);

        // delta_x = x_new - x0
        let delta_x = x_new.sub(self.x0).unwrap();

        // delta_y = y0 - n_new
        let delta_y = self.y0.sub(y_new).unwrap();

        SwapResult {
            k,
            x_new,
            y_new,
            delta_x,
            delta_y,
        }
    }

    /// Compute swap result from x to y using a constant product curve given delta x
    pub fn swap_x_to_y_hmm(&self, delta_x: u64) -> SwapResult {
        let delta_x = Decimal::from_u64(delta_x);
        let k = self.compute_k();
        let x_new = self.compute_x_new(&delta_x);
        let delta_y = self.compute_delta_y_hmm(&delta_x);
        let y_new = self.y0.add(delta_y).unwrap();

        SwapResult {
            k,
            x_new,
            y_new,
            delta_x,
            delta_y,
        }
    }

    /// Compute delta y using a constant product curve given delta x
    fn compute_delta_y_amm(&self, delta_x: &Decimal) -> Decimal {
        // Δy = K/(X₀ + Δx) - K/X₀
        // delta_y = k/(self.x0 + delta_x) - k/self.x0
        let k = self.compute_k();
        let x_new = self.compute_x_new(&delta_x);

        k.div(*&x_new).sub(k.div(self.x0)).expect("k/self.x0")
    }

    /// Compute delta x using a constant product curve given delta y
    pub fn compute_delta_x_amm(&self, delta_y: &Decimal) -> Decimal {
        // Δx = K/(Y₀ + Δy) - K/Y₀
        // delta_x = k/(sef.y0 + delta_y) - k/self.y0
        let k = self.compute_k();
        let y_new = self.compute_y_new(&delta_y);

        k.div(y_new).sub(k.div(self.y0)).expect("k/self.y0")
    }

    /// Compute delta y using a baseline curve given delta y
    fn compute_delta_y_hmm(&self, delta_x: &Decimal) -> Decimal {
        let x_new = self.compute_x_new(delta_x);
        let xi = self.compute_xi();
        let k = self.compute_k();

        if x_new.gt(self.x0).unwrap() && self.x0.gte(xi).unwrap() {
            // Condition 1
            // (Δx > 0 AND X₀ >= Xᵢ) [OR (Δx < 0 AND X₀ <= Xᵢ)] <= redundant because delta x always > 0
            // Oracle price is better than the constant product price.
            self.compute_delta_y_amm(delta_x)
        } else if x_new.gt(self.x0).unwrap() && x_new.lte(xi).unwrap() {
            // Condition 2
            // (Δx > 0 AND X_new <= Xᵢ) [OR (Δx < 0 AND X_new >= Xᵢ)]
            // Constant product price is better than the oracle price even after the full trade.
            self.compute_integral(&k, &self.x0, &x_new, &xi, &self.c)
        } else {
            // Condition 3
            // Constant product price is better than the oracle price at the start of the trade.
            // delta_y = compute_integral(k, x0, xi, xi, c) + (k/x_new - k/xi)
            let integral = self.compute_integral(&k, &self.x0, &xi, &xi, &self.c);

            // rhs = (k/x_new - k/xi)
            let k_div_x_new = k.div(x_new);
            let k_div_xi = k.div(xi);
            let rhs = k_div_x_new.sub(k_div_xi).unwrap();

            integral.add(rhs).unwrap()
        }
    }

    /// Compute delta x using a baseline curve given delta y
    pub fn compute_delta_x_hmm(&self, delta_y: &Decimal) -> Decimal {
        let y_new = self.compute_y_new(delta_y);
        let yi = self.compute_yi();
        let k = self.compute_k();

        if y_new.gt(self.y0).unwrap() && self.y0.gte(yi).unwrap() {
            // Condition 1
            // (Δy > 0 AND Y₀ >= Yᵢ) [OR (Δy < 0 AND Y₀ <= Yᵢ)] <= redundant because delta y always > 0
            // Oracle price is better than the constant product price.
            self.compute_delta_x_amm(delta_y)
        } else if y_new.gt(self.y0).unwrap() && y_new.lte(yi).unwrap() {
            // Condition 2
            // (Δy > 0 AND Y_new <= Yᵢ) [OR (Δy < 0 AND Y_new >= Yᵢ)] <= redundant because delta y always > 0
            // Constant product price is better than the oracle price even after the full trade.
            self.compute_integral(&k, &self.y0, &y_new, &yi, &self.c)
        } else {
            // Condition 3
            // Constant product price is better than the oracle price at the start of the trade.
            // delta_x = compute_integral(k, y0, yi, yi, c) + (k/x_new - k/xi)
            let integral = self.compute_integral(&k, &self.y0, &yi, &yi, &self.c);

            // rhs = (k/x_new - k/xi)
            let k_div_y_new = k.div(y_new);
            let k_div_yi = k.div(yi);
            let rhs = k_div_y_new.sub(k_div_yi).unwrap();

            integral.add(rhs).unwrap()
        }
    }

    /// Compute the integral with different coefficient values of c
    fn compute_integral(
        &self,
        k: &Decimal,
        q0: &Decimal,
        q_new: &Decimal,
        qi: &Decimal,
        c: &Decimal,
    ) -> Decimal {
        let one = Decimal::from_u64(1).to_scale(self.x0.scale);
        if c.eq(&one) {
            // k/qi * (q0/q_new).ln()
            let k_div_qi = k.div(*qi);

            let q0_div_q_new = q0.div(*q_new);
            let log_q0_div_q_new = q0_div_q_new.ln().unwrap();
            k_div_qi.mul(log_q0_div_q_new)
        } else {
            // k/((qi**c)*(c-1)) * (q0**(c-1)-q_new**(c-1))
            // k/(qi**c)/(c-1) * (q0**(c-1)-q_new**(c-1))
            // (k*q0**(c-1) - k*q_new**(c-1)) /(qi**c)/(c-1)
            // a = k/q0**(c-1)
            // b = k/q_new**(c-1)
            // (a - b) / (qi**c) / (c-1)

            // c-1
            let c_sub_one = c.sub(one).unwrap();
            // qi**c
            let qi_pow_c = qi.pow(*c);

            if c_sub_one.negative {
                // a = k/q0**(c-1)
                let a = k.div(q0.pow(c_sub_one));
                // b = k/q_new**(c-1)
                let b = k.div(q_new.pow(c_sub_one));

                let a_sub_b = a.sub(b).unwrap();

                // (a - b) / (qi**c) / (c-1)
                let result = a_sub_b.div(qi_pow_c).div(c_sub_one);
                result
            } else {
                // a = k*q0**(c-1)
                // b = k*q_new**(c-1)
                // lhs = k/((qi**c)*(c-1))
                // (qi**c)*(c-1)
                let lhs_den = qi_pow_c.mul(c_sub_one);
                let lhs = k.div(lhs_den);

                // q0**(c-1)
                let q0_pow_c_sub_one = q0.pow(c_sub_one);
                // q_new**(c-1)
                let q_new_pow_c_sub_one = q_new.pow(c_sub_one);

                // rhs = q0**(c-1) - q_new**(c-1)
                let rhs = q0_pow_c_sub_one.sub(q_new_pow_c_sub_one).unwrap();

                // lhs * rhs
                lhs.mul(rhs)
            }
        }
    }

    /// Compute constant product curve invariant k
    fn compute_k(&self) -> Decimal {
        // k = x0 * y0
        self.x0.mul(self.y0)
    }

    /// Compute the token balance of x assuming the constant product price
    /// is the same as the oracle price.
    /// i = K/Xᵢ² ∴ Xᵢ = √K/i
    fn compute_xi(&self) -> Decimal {
        // Xᵢ = √K/i
        let k = self.compute_k();
        let k_div_i = k.div(self.i);
        k_div_i.sqrt().expect("xi")
        // checked_pow_fraction(&k_div_i, &half())
    }

    /// Compute the token balance of y assuming the constant product price
    /// is the same as the oracle price
    /// i = K/Yᵢ² ∴ Yᵢ = √(K/1/i) = √(K * i)
    fn compute_yi(&self) -> Decimal {
        // Yᵢ = √(K/1/i) = √(K * i)
        let k = self.compute_k();
        let k_mul_i = k.mul(self.i);
        k_mul_i.sqrt().expect("yi")
        // let (k_mul_i, _negative) = signed_mul(&k, false, &self.i, false);
        // checked_pow_fraction(&k_mul_i, &half())
    }

    /// Compute new amount for x
    fn compute_x_new(&self, delta_x: &Decimal) -> Decimal {
        // x_new = x0 + delta_x
        self.x0.add(*delta_x).expect("compute_x_new")
    }

    /// Compute new amount for y
    fn compute_y_new(&self, delta_y: &Decimal) -> Decimal {
        // y_new = y0 + delta_y
        self.y0.add(*delta_y).expect("compute_y_new")
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use std::collections::HashMap;

    use crate::decimal::{Decimal, AMOUNT_SCALE};
    use hydra_math_simulator_rs::Model;
    use proptest::prelude::*;

    use super::*;

    fn coefficient_allowed_values(scale: u8) -> HashMap<&'static str, (u128, u128, Decimal)> {
        HashMap::from([
            ("0.0", (0, 0, Decimal::from_u128(0).to_scale(scale))),
            ("1.0", (1, 1, Decimal::from_u128(1).to_scale(scale))),
            (
                "1.25",
                (
                    5,
                    4,
                    Decimal::from_u128(5)
                        .to_scale(scale)
                        .div(Decimal::from_u128(4).to_scale(scale)),
                ),
            ),
            (
                "1.5",
                (
                    3,
                    2,
                    Decimal::from_u128(3)
                        .to_scale(scale)
                        .div(Decimal::from_u128(2).to_scale(scale)),
                ),
            ),
        ])
    }

    fn check_k(model: &Model, x0: u128, y0: u128) {
        let swap = SwapCalculator {
            x0: Decimal::from_u128(x0),
            y0: Decimal::from_u128(y0),
            c: Decimal::from_u128(0),
            i: Decimal::from_u128(0),
        };
        let result = swap.compute_k();
        let value = model.sim_k();
        let expected = Decimal::new(value, 0, false);
        assert_eq!(result, expected, "check_k");
    }

    fn check_xi(model: &Model, x0: u128, y0: u128, i: u128) {
        let swap = SwapCalculator {
            x0: Decimal::from_u128(x0),
            y0: Decimal::from_u128(y0),
            c: Decimal::from_u128(0),
            i: Decimal::from_u128(i),
        };
        let result = swap.compute_xi();
        let (value, negative) = model.sim_xi();
        let expected = Decimal::new(value, 0, negative);
        assert_eq!(result, expected, "check_xi");
    }

    fn check_delta_y_amm(model: &Model, x0: u128, y0: u128, delta_x: u128) {
        let swap = SwapCalculator {
            x0: Decimal::from_u128(x0),
            y0: Decimal::from_u128(y0),
            c: Decimal::from_u128(0),
            i: Decimal::from_u128(0),
        };
        let result = swap.compute_delta_y_amm(&Decimal::from_u128(delta_x));
        let (value, negative) = model.sim_delta_y_amm(delta_x);
        let expected = Decimal::new(value, 0, negative);
        assert_eq!(result, expected, "check_delta_y_amm");
    }

    fn check_swap_x_to_y_amm(model: &Model, x0: u128, y0: u128, delta_x: u128) {
        let swap = SwapCalculator {
            x0: Decimal::from_u128(x0),
            y0: Decimal::from_u128(y0),
            c: Decimal::from_u128(0),
            i: Decimal::from_u128(0),
        };

        let swap_x_to_y_amm = swap.swap_x_to_y_amm(delta_x);
        let expected = model.sim_swap_x_to_y_amm(delta_x);
        assert_eq!(swap_x_to_y_amm.x_new.value, expected.0, "x_new");
        assert_eq!(swap_x_to_y_amm.delta_x.value, expected.1, "delta_x");
        assert!(
            swap_x_to_y_amm
                .y_new
                .value
                .saturating_sub(expected.2)
                .lt(&2u128),
            "y_new"
        );
        assert!(
            swap_x_to_y_amm
                .delta_y
                .value
                .saturating_sub(expected.3)
                .lt(&2u128),
            "delta_y"
        );
    }

    //
    // fn check_delta_y_hmm(
    //     model: &Model,
    //     x0: u128,
    //     y0: u128,
    //     c: PreciseNumber,
    //     i: u128,
    //     delta_x: u128,
    // ) {
    //     let swap = SwapCalculator {
    //         x0: PreciseNumber::new(x0).unwrap(),
    //         y0: PreciseNumber::new(y0).unwrap(),
    //         c,
    //         i: PreciseNumber::new(i).unwrap(),
    //     };
    //     let result = swap.compute_delta_y_hmm(&PreciseNumber::new(delta_x).unwrap());
    //     let expected = model.sim_delta_y_hmm(delta_x);
    //
    //     assert!(
    //         result.0.almost_eq(&expected.0, desired_precision(&swap.c)),
    //         "check_delta_y_hmm result: {}, expected: {}, diff: {:?}",
    //         result.0.value,
    //         &expected.0.value,
    //         &expected.0.unsigned_sub(&result.0)
    //     );
    //     assert_eq!(result.1, expected.1, "check_delta_y_hmm signed")
    // }
    //
    // fn check_delta_x_hmm(
    //     model: &Model,
    //     x0: u128,
    //     y0: u128,
    //     c: PreciseNumber,
    //     i: u128,
    //     delta_y: u128,
    // ) {
    //     let swap = SwapCalculator {
    //         x0: PreciseNumber::new(x0).unwrap(),
    //         y0: PreciseNumber::new(y0).unwrap(),
    //         c,
    //         i: PreciseNumber::new(i).unwrap(),
    //     };
    //     let result = swap.compute_delta_x_hmm(&PreciseNumber::new(delta_y).unwrap());
    //     let expected = model.sim_delta_x_hmm(delta_y);
    //
    //     assert!(
    //         result.0.almost_eq(&expected.0, desired_precision(&swap.c)),
    //         "check_delta_x_hmm result: {}, expected: {}, diff: {:?}",
    //         result.0.value,
    //         &expected.0.value,
    //         &expected.0.unsigned_sub(&result.0)
    //     );
    //     assert_eq!(result.1, expected.1, "check_delta_x_hmm signed")
    // }
    //
    proptest! {
        #[test]
        fn test_full_curve_math(
            x0 in 1..u128::MAX >> 64,
            y0 in 1..u128::MAX >> 64,
            c in (0..=3usize).prop_map(|v| ["0.0", "1.0", "1.25", "1.5"][v]),
            i in 1u128..=100u128,
            delta_x in 1u128..=10u128,
        ) {
            for (c_numer, c_denom, _c) in coefficient_allowed_values(AMOUNT_SCALE).get(c) {
                let model = Model::new(x0, y0, *c_numer, *c_denom, i);
                check_k(&model, x0, y0);
                check_xi(&model, x0, y0, i);
                check_delta_y_amm(&model, x0, y0, delta_x);
                check_swap_x_to_y_amm(&model, x0, y0, delta_x);
            }
        }
    }
    //
    // proptest! {
    //     #[test]
    //     fn test_partial_curve_math(
    //         x0 in 1..u128::MAX >> 120,
    //         y0 in 1..u128::MAX >> 120,
    //         c in (0..=3usize).prop_map(|v| ["0.0", "1.0", "1.25", "1.5"][v]),
    //         i in 1u128..=5u128,
    //         delta_x in 1u128..=5u128,
    //         delta_y in 1u128..=5u128,
    //     ) {
    //         for (c_numer, c_denom, c_precise) in coefficient_allowed_values().get(c) {
    //             let model = Model::new(x0, y0, *c_numer, *c_denom, i);
    //             check_delta_y_hmm(&model, x0, y0, c_precise.clone(), i, delta_x);
    //             check_delta_x_hmm(&model, x0, y0, c_precise.clone(), i, delta_y);
    //         }
    //     }
    // }
    //
    #[test]
    fn test_specific_curve_math() {
        // Notes of allowed ranged depending on decimal places (scale)
        // log2(10^12) = 40 bits for 12 decimal places, 24 bits for integer
        // ((2**24) - 1) = 16,777,215 max
        // log2(10^8) = 27 bits for 8 decimal places, 37 bits for integer
        // ((2**37) - 1) = 137,438,953,471 max
        // log2(10^6) = 20 bits for 6 decimal places, 44 bits for integer
        // ((2**44) - 1) = 17,592,186,044,415 max

        // compute_delta_y_hmm when c == 1
        {
            let swap = SwapCalculator {
                x0: Decimal::from_u128(37).to_scale(12),
                y0: Decimal::from_u128(126).to_scale(12),
                c: Decimal::from_u128(1).to_scale(12),
                i: Decimal::from_u128(3).to_scale(12),
            };
            let delta_x = Decimal::from_u128(3).to_scale(12);
            let result = swap.compute_delta_y_hmm(&delta_x).to_scale(8);
            // python: -9.207_401_794_786
            let expected = Decimal::new(9_207_401_79, 8, false);

            assert!(
                result.eq(expected).unwrap(),
                "compute_delta_y_hmm {}, {}",
                result.value,
                expected.value
            );
            assert_eq!(result.negative, true);
        }

        // compute_delta_y_hmm when c == 0
        {
            let swap = SwapCalculator {
                x0: Decimal::from_u128(32).to_scale(12),
                y0: Decimal::from_u128(33).to_scale(12),
                c: Decimal::from_u128(0).to_scale(12),
                i: Decimal::from_u128(1).to_scale(12),
            };
            let delta_x = Decimal::from_u128(1).to_scale(12);
            let result = swap.compute_delta_y_hmm(&delta_x).to_scale(8);
            // python: -1.000_000_000_000
            let expected = Decimal::new(1_000_000_00, 8, false);

            assert!(
                result.eq(expected).unwrap(),
                "compute_delta_y_hmm {}, {}",
                result.value,
                expected.value
            );
            assert_eq!(result.negative, true);
        }

        // compute_delta_x_hmm when c == 0
        {
            let swap = SwapCalculator {
                x0: Decimal::from_u128(216).to_scale(12),
                y0: Decimal::from_u128(193).to_scale(12),
                c: Decimal::from_u128(0).to_scale(12),
                i: Decimal::from_u128(1).to_scale(12),
            };
            let delta_y = Decimal::from_u128(4).to_scale(12);
            let result = swap.compute_delta_x_hmm(&delta_y).to_scale(8);
            // python: -4.385_786_802_030
            let expected = Decimal::new(4_385_786_80, 8, false);

            assert!(
                result.eq(expected).unwrap(),
                "compute_delta_x_hmm {}, {}",
                result.value,
                expected.value
            );
            assert_eq!(result.negative, true);
        }

        // xi specific
        {
            let swap = SwapCalculator {
                x0: Decimal::from_u128(1000).to_scale(12),
                y0: Decimal::from_u128(1000).to_scale(12),
                c: Decimal::from_u128(0).to_scale(12),
                i: Decimal::from_u128(200).to_scale(12),
            };
            // ((1000*1000)/200)**0.5 = 70.710678118654752
            // https://www.wolframalpha.com/input/?i=%28%281000*1000%29%2F200%29**0.5
            let result = swap.compute_xi().to_scale(12);
            let expected = Decimal::new(70_710_678_118_654u128, 12, false);

            assert!(
                result.eq(expected).unwrap(),
                "compute_xi {}, {}",
                result.value,
                expected.value
            );
            assert_eq!(result.negative, false);
        }
    }
}
