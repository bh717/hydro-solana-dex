use crate::cl_pool_pn::hydra_math_legacy::{
    checked_pow_fraction, ln, signed_addition, signed_mul, sqrt_precise,
};
use spl_math::precise_number::{PreciseNumber as PN, ONE};

pub trait PoolMathPN {
    const FLOOR_LIQ: bool = false; //* no longer needed in PreciseNumber setting

    fn zero() -> PN {
        PN::new(0).expect("zero")
    }
    fn one() -> PN {
        PN::new(1).expect("one")
    }
    fn two() -> PN {
        PN::new(2).expect("two")
    }

    fn tick_base() -> PN {
        PN::new(10001_u128)
            .unwrap()
            .checked_div(&PN::new(10000_u128).unwrap())
            .unwrap()
    }
    fn adj_whole_fill() -> PN {
        //* no longer needed in PreciseNumber setting
        PN::new(0_u128)
            .unwrap()
            .checked_div(&PN::new(1000_000_000_000_u128).unwrap())
            .unwrap()
    }
    fn adj_withdrawal() -> PN {
        //* still NEEDED for rounding down withdrawals, avoid out_qty > reserve by tiny amt
        PN::new(1_u128)
            .unwrap()
            .checked_div(&PN::new(1000_000_000_000_u128).unwrap())
            .unwrap()
    }

    fn pn(n: u128) -> PN {
        // shortcut to create Precise number
        PN::new(n).unwrap()
    }

    fn pn_from_innner_value(inner: u128) -> PN {
        // shortcut to create Precise number with a inner value equal to input
        PN::new(inner)
            .unwrap()
            .checked_div(&PN::new(ONE).unwrap())
            .unwrap()
    }

    fn tick_to_rp(tick: u128) -> PN {
        sqrt_precise(&Self::tick_base())
            .unwrap()
            .checked_pow(tick)
            .unwrap()
    }

    fn rp_to_tick_loop(rp: &PN, left_to_right: bool, start: u128) -> u128 {
        let m = sqrt_precise(&Self::tick_base()).unwrap();
        let mut rez = m.checked_pow(start).unwrap();
        let mut x = start;
        let result = loop {
            rez = rez.checked_mul(&m).unwrap();
            if rez.greater_than_or_equal(rp) {
                match left_to_right {
                    true => break x + 1,
                    false => break x,
                }
            }
            x = x + 1u128;
        };
        result
    }

    fn tk_to_possible_tk(tick: u128, spacing: u128, left_to_right: bool) -> u128 {
        // use tk_spacing to find allowable/ initializable tick that is <= tick
        // (if left_to_right is false) or >= tick (if left_to_right is true)
        // returns unchanged tick if self.tick_spacing is 1
        let ts = Self::pn(spacing);
        let tk = Self::pn(tick);
        let result = match left_to_right {
            false => tk.checked_div(&ts).unwrap().floor().unwrap(),
            true => tk.checked_div(&ts).unwrap().ceiling().unwrap(),
        };
        result.checked_mul(&ts).unwrap().to_imprecise().unwrap()
    }

    fn rp_to_possible_tk(rp: &PN, spacing: u128, left_to_right: bool, start: u128) -> u128 {
        // find allowable tick from given rp

        let tick_theo = Self::rp_to_tick_loop(rp, left_to_right, start);
        Self::tk_to_possible_tk(tick_theo, spacing, left_to_right)
    }

    fn liq_x_only(x: &PN, rpa: &PN, rpb: &PN) -> PN {
        // Lx : liquidity amount when liquidity fully composed of  token x
        // e.g when price below lower bound of range and y=0. [5]
        // x : token x real reserves; rPa,rPb : range lower (upper) bound in root price
        // x * rpa * rpb / (rpb - rpa) //* should always be positive
        let rpb_minus_rpa = &rpb.checked_sub(rpa).unwrap();
        x.checked_mul(rpa)
            .unwrap()
            .checked_mul(rpb)
            .unwrap()
            .checked_div(rpb_minus_rpa)
            .unwrap()
    }

    fn liq_y_only(y: &PN, rpa: &PN, rpb: &PN) -> PN {
        // Ly : liquidity amount when liquidity fully composed of  token y
        // e.g when price above upper bound of range, x=0. [9]
        //    y : token y real reserves;  rPa,rPb : range lower (upper) bound in root price
        // y / (rpb - rpa)
        let rpb_minus_rpa = &rpb.checked_sub(rpa).unwrap();
        y.checked_div(rpb_minus_rpa).unwrap()
    }

    fn liq_from_x_y_rp_rng(x: &PN, y: &PN, rp: &PN, rpa: &PN, rpb: &PN) -> PN {
        // L : liquidity amount from real reserves based on where price is compared to price range
        //    x,y : real token reserves ; rP : current root price
        //    rPa,rPb : range lower (upper) bound in root price
        if rp.less_than_or_equal(rpa) {
            // y = 0 and reserves entirely in x. [4]
            return Self::liq_x_only(x, rpa, rpb);
        } else if rp.less_than(rpb) {
            // [11,12]
            // x covers sub-range [P,Pb] and y covers the other side [Pa,P]
            let lx = Self::liq_x_only(x, rp, rpb);
            let ly = Self::liq_y_only(y, rpa, rp);
            // Lx Ly should be close to equal, by precaution take the minimum
            match lx.less_than_or_equal(&ly) {
                true => lx,
                false => ly,
            }
        } else {
            // x = 0 and reserves entirely in y. [8]
            Self::liq_y_only(y, rpa, rpb)
        }
    }

    fn liq_from_x_y_tick_rng(x: &PN, y: &PN, t: u128, ta: u128, tb: u128) -> PN {
        // tick as inputs instead of root prices
        let rp = &Self::tick_to_rp(t);
        let rpa = &Self::tick_to_rp(ta);
        let rpb = &Self::tick_to_rp(tb);
        Self::liq_from_x_y_rp_rng(x, y, rp, rpa, rpb)
    }

    fn x_from_l_rp_rng(l: &PN, rp: &PN, rpa: &PN, rpb: &PN) -> PN {
        // calculate X amount from L, price and bounds
        // if the price is outside the range, use range endpoints instead [11]

        // let rp = rp.min(rpb).max(rpa);
        let i = match rp.less_than_or_equal(&rpb) {
            true => rp,
            false => rpb,
        };
        let rp = match i.greater_than_or_equal(&rpa) {
            true => i,
            false => rpa,
        };
        let rpb_minus_rp = rpb.checked_sub(rp).unwrap();
        let rp_mul_rpb = rp.checked_mul(rpb).unwrap();

        // l * (rpb - rp) / (rp * rpb)
        l.checked_mul(&rpb_minus_rp)
            .unwrap()
            .checked_div(&rp_mul_rpb)
            .unwrap()
    }

    fn x_from_l_tick_rng(l: &PN, t: u128, ta: u128, tb: u128) -> PN {
        // tick as inputs instead of root prices
        let rp = &Self::tick_to_rp(t);
        let rpa = &Self::tick_to_rp(ta);
        let rpb = &Self::tick_to_rp(tb);
        Self::x_from_l_rp_rng(l, rp, rpa, rpb)
    }

    fn y_from_l_rp_rng(l: &PN, rp: &PN, rpa: &PN, rpb: &PN) -> PN {
        // calculate Y amount from L, price and bounds
        // if the price is outside the range, use range endpoints instead [11]
        // let rp = rp.min(rpb).max(rpa);
        let i = match rp.less_than_or_equal(&rpb) {
            true => rp,
            false => rpb,
        };
        let rp = match i.greater_than_or_equal(&rpa) {
            true => i,
            false => rpa,
        };
        // l * (rp - rpa) //* should always be positive
        let rp_minus_rpa = rp.checked_sub(rpa).unwrap();
        l.checked_mul(&rp_minus_rpa).unwrap()
    }

    fn y_from_l_tick_rng(l: &PN, t: u128, ta: u128, tb: u128) -> PN {
        // tick as inputs instead of root prices
        let rp = &Self::tick_to_rp(t);
        let rpa = &Self::tick_to_rp(ta);
        let rpb = &Self::tick_to_rp(tb);
        Self::y_from_l_rp_rng(l, rp, rpa, rpb)
    }

    fn rpa_from_l_rp_y(l: &PN, rp: &PN, y: &PN) -> PN {
        // lower bound from L, price and y amount [13]
        // rp - (y / l)
        let y_div_l = y.checked_div(l).unwrap();
        rp.checked_sub(&y_div_l).unwrap()
    }

    fn rpb_from_l_rp_x(l: &PN, rp: &PN, x: &PN) -> PN {
        // upper bound from L, price and x amount [14]
        // l * rp / (l - rp * x)
        let rp_mul_x = rp.checked_mul(x).unwrap();
        let denom = l.checked_sub(&rp_mul_x).unwrap();
        l.checked_mul(rp).unwrap().checked_div(&denom).unwrap()
    }

    fn rpa_from_x_y_rp_rpb(x: &PN, y: &PN, rp: &PN, rpb: &PN) -> PN {
        // lower bound from x, y amounts, price and upper bound [15]
        // y / (rpb * x) + rp - y / (rp * x)
        let rpb_mul_x = rpb.checked_mul(x).unwrap();
        let first_term = y.checked_div(&rpb_mul_x).unwrap();
        let rp_mul_x = rp.checked_mul(x).unwrap();
        let last_term = y.checked_div(&rp_mul_x).unwrap();

        first_term
            .checked_add(rp)
            .unwrap()
            .checked_sub(&last_term)
            .unwrap()
    }

    fn rpb_from_x_y_rp_rpa(x: &PN, y: &PN, rp: &PN, rpa: &PN) -> PN {
        // upper bound from x, y amounts, price and lower bound [16]
        // (rp * y) / ((rpa - rp) * rp * x + y)
        let numer = rp.checked_mul(y).unwrap();
        let rp_minus_rpa = rp.checked_sub(rpa).unwrap();
        let d1 = rp_minus_rpa
            .checked_mul(rp)
            .unwrap()
            .checked_mul(x)
            .unwrap();
        // d1 shoud be positive as rp >= rpa
        let denom = y.checked_sub(&d1).unwrap();
        numer.checked_div(&denom).unwrap()
    }
    //+ change to signed_ops above here

    fn dx_from_l_drp(l: &PN, rp_old: &PN, rp_new: &PN) -> (PN, bool) {
        // Change of reserve X based of change of price
        // // l * (1.0 / rp_new - 1.0 / rp_old)
        // let inv_rp_new = Self::pn(1u128).checked_div(rp_new).unwrap();
        // let inv_rp_old = Self::pn(1u128).checked_div(rp_old).unwrap();

        // let (diff, diff_neg) = signed_addition(&inv_rp_new, false, &inv_rp_old, true);

        // signed_mul(l, false, &diff, diff_neg)

        // l * (1.0 / rp_new - 1.0 / rp_old) = l * (rp_old - rp_new) / (rp_old * rp_new)
        //? this way of calculating needs to be consistent with x_from_l_rp_rng
        //? so use later (single division) not fromer with inverses

        let (diff, diff_neg) = signed_addition(&rp_old, false, &rp_new, true);
        let old_mul_new = rp_old.checked_mul(rp_new).unwrap();

        let (l_mul_diff_abs, result_sign) = signed_mul(l, false, &diff, diff_neg);
        let result_abs = l_mul_diff_abs.checked_div(&old_mul_new).unwrap();
        (result_abs, result_sign)
    }

    fn dy_from_l_drp(l: &PN, rp_old: &PN, rp_new: &PN) -> (PN, bool) {
        // Change of reserve Y based of change of price
        // l * (rp_new - rp_old)
        let (diff, diff_neg) = signed_addition(&rp_new, false, &rp_old, true);

        signed_mul(l, false, &diff, diff_neg)
    }

    fn dx_from_l_drp_hmm(l: &PN, rp_old: &PN, rp_new: &PN, c: &PN, rp_oracle: &PN) -> (PN, bool) {
        // chg of reserve x based of chg of price with hmm adj
        let one = Self::one();
        if c.less_than(&one) {
            panic!("cannot handle hmm with C<1");
        }
        if rp_old.eq(rp_new) {
            return (Self::pn(0_u128), false);
        }
        if c.eq(&one) {
            // return l / rp_oracle * (rp_old / rp_new).ln();

            let ln_rp_old = ln(&rp_old).unwrap();
            let ln_rp_new = ln(&rp_new).unwrap();
            let (log_of_ratio, log_sign) = ln_rp_old.unsigned_sub(&ln_rp_new);
            return (
                l.checked_div(&rp_oracle)
                    .unwrap()
                    .checked_mul(&log_of_ratio)
                    .unwrap(),
                log_sign,
            );
        } else {
            // let omc = 1.0 - c; // one minus c
            // let cmo = -omc; // c minus one
            // return l / rp_oracle.powf(c) * (rp_new.powf(cmo) - rp_old.powf(cmo)) / omc;
            let (cmo, _) = c.unsigned_sub(&one);
            let rp_oracle_pow_c = checked_pow_fraction(rp_oracle, c);
            let rp_new_pow_cmo = checked_pow_fraction(rp_new, &cmo);
            let rp_old_pow_cmo = checked_pow_fraction(rp_old, &cmo);
            let (diff, diff_sign) = rp_new_pow_cmo.unsigned_sub(&rp_old_pow_cmo);
            // we flip the sign as we need to divide by (1 - c)  not c - 1
            return (
                l.checked_div(&rp_oracle_pow_c)
                    .unwrap()
                    .checked_mul(&diff)
                    .unwrap()
                    .checked_div(&cmo)
                    .unwrap(),
                !diff_sign,
            );
        }
    }

    fn dy_from_l_drp_hmm(l: &PN, rp_old: &PN, rp_new: &PN, c: &PN, rp_oracle: &PN) -> (PN, bool) {
        // chg of reserve y based of chg of price with hmm adj
        let one = Self::one();
        if c.less_than(&one) {
            panic!("cannot handle hmm with C<1");
        }
        if rp_old.eq(rp_new) {
            return (Self::pn(0_u128), false);
        }
        if c.eq(&one) {
            // l * rp_oracle * (rp_old / rp_new).ln()
            let ln_rp_old = ln(&rp_old).unwrap();
            let ln_rp_new = ln(&rp_new).unwrap();
            let (log_of_ratio, log_sign) = ln_rp_old.unsigned_sub(&ln_rp_new);
            return (
                l.checked_mul(&rp_oracle)
                    .unwrap()
                    .checked_mul(&log_of_ratio)
                    .unwrap(),
                log_sign,
            );
        } else {
            // let omc = 1.0 - c; // one minus c
            // l * rp_oracle.powf(c) * (1.0/rp_new.powf(cmo) - 1.0/ rp_old.powf(cmo)) / omc
            let (cmo, _) = c.unsigned_sub(&one);
            let rp_oracle_pow_c = checked_pow_fraction(rp_oracle, c);
            let rp_new_pow_cmo = checked_pow_fraction(rp_new, &cmo);
            let rp_old_pow_cmo = checked_pow_fraction(rp_old, &cmo);
            let inv_rp_new_pow_cmo = one.checked_div(&rp_new_pow_cmo).unwrap();
            let inv_rp_old_pow_cmo = one.checked_div(&rp_old_pow_cmo).unwrap();

            let (diff, diff_sign) = inv_rp_new_pow_cmo.unsigned_sub(&inv_rp_old_pow_cmo);
            // we flip the sign as we need to divide by (1 - c)  not c - 1
            return (
                l.checked_mul(&rp_oracle_pow_c)
                    .unwrap()
                    .checked_mul(&diff)
                    .unwrap()
                    .checked_div(&cmo)
                    .unwrap(),
                !diff_sign,
            );
        }
    }

    fn rp_new_from_l_dx(l: &PN, rp_old: &PN, dx: &PN) -> PN {
        // new price based of change of reserve x //*always positive
        // drp_inv = dx / l = (1/rp_new - 1/rp_old)
        // after solving for rp_new: rp_new = (l * rp_old) / (dx*rp_old + l)

        let numerator = l.checked_mul(&rp_old).unwrap();
        let denom = dx.checked_mul(&rp_old).unwrap().checked_add(&l).unwrap();
        numerator.checked_div(&denom).unwrap()
    }

    fn rp_new_from_l_dy(l: &PN, rp_old: &PN, dy: &PN) -> PN {
        // new price based of change of reserve y //*always positive
        // dy / l + rp_old
        dy.checked_div(l).unwrap().checked_add(rp_old).unwrap()
    }
}
