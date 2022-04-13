use hydra_math_rs::decimal::*;
use std::ops::Neg;

pub trait PoolMath {
    // * All Decimal inputs are assumed to be 'computable' scale on arrival
    // * And all outputs 'computable' scale
    // * All tick are internally handled as u128 and returned as such

    const FLOOR_LIQ: bool = false; //* no longer needed in PreciseNumber setting

    fn adj_whole_fill() -> Decimal {
        //* no longer needed in PreciseNumber setting
        Decimal::new(0, 12, false).to_compute_scale()
    }
    fn adj_withdrawal() -> Decimal {
        //* still NEEDED for rounding down withdrawals, avoid out_qty > reserve by tiny amt
        Decimal::new(1, 12, false).to_compute_scale()
    }

    fn zero() -> Decimal {
        Decimal::default().to_compute_scale()
    }
    fn one() -> Decimal {
        Decimal::one().to_compute_scale()
    }
    fn two() -> Decimal {
        Decimal::two().to_compute_scale()
    }

    fn tick_base() -> Decimal {
        Decimal::new(10001_u128, 4_u8, false).to_compute_scale()
    }

    fn tick_base_root() -> Decimal {
        Self::tick_base().sqrt().unwrap()
    }

    fn tick_to_rp(tick: u128) -> Decimal {
        // Self::tick_base().pow(tick as u128).sqrt().unwrap()
        Self::tick_base_root().pow(tick as u128)
    }

    fn rp_to_tick(rp: Decimal, left_to_right: bool) -> u128 {
        let base = Self::tick_base_root();
        let tick_decimal = match left_to_right {
            true => rp.ln().unwrap().div_up(base.ln().unwrap()),
            false => rp.ln().unwrap().div(base.ln().unwrap()),
        };
        tick_decimal.to_scale(0).value as u128
    }

    fn rp_to_tick_loop(rp: Decimal, left_to_right: bool, start: u128) -> u128 {
        let m = Self::tick_base_root();
        let mut rez = m.pow(start);
        let mut x = start;
        let result = loop {
            rez = rez.mul(m);
            if rez.gte(rp).unwrap() {
                match left_to_right {
                    true => break x + 1,
                    false => break x,
                }
            }
            x = x + 1;
        };
        result
    }

    fn tk_to_possible_tk(tick: u128, spacing: u128, left_to_right: bool) -> u128 {
        // use tk_spacing to find allowable/ initializable tick that is <= tick
        // (if left_to_right is false) or >= tick (if left_to_right is true)
        // returns unchanged tick if self.tick_spacing is 1
        let ts = Decimal::from_u128(spacing);
        let tk = Decimal::from_u128(tick);
        let result = match left_to_right {
            false => tk.div(ts).mul(ts),
            true => tk.div_up(ts).mul(ts),
        };
        result.into()
    }

    fn rp_to_possible_tk(rp: Decimal, spacing: u128, left_to_right: bool, start: u128) -> u128 {
        // find allowable tick from given rp
        let tick_theo = Self::rp_to_tick_loop(rp, left_to_right, start);
        Self::tk_to_possible_tk(tick_theo, spacing, left_to_right)
    }

    fn liq_x_only(x: Decimal, rpa: Decimal, rpb: Decimal) -> Decimal {
        // Lx : liquidity amount when liquidity fully composed of  token x
        // e.g when price below lower bound of range and y=0. [5]
        // x : token x real reserves; rPa,rPb : range lower (upper) bound in root price
        // x * rpa * rpb / (rpb - rpa) //* should always be positive

        let rpb_minus_rpa = rpb.sub(rpa).unwrap();
        if rpb_minus_rpa.negative {
            panic!("liq_x_only:rpb_minus_rpa should always be positive");
        }
        x.mul(rpa).mul(rpb).div(rpb_minus_rpa)
    }

    fn liq_y_only(y: Decimal, rpa: Decimal, rpb: Decimal) -> Decimal {
        // Ly : liquidity amount when liquidity fully composed of  token y
        // e.g when price above upper bound of range, x=0. [9]
        //    y : token y real reserves;  rPa,rPb : range lower (upper) bound in root price
        // y / (rpb - rpa)
        let rpb_minus_rpa = rpb.sub(rpa).unwrap();
        y.div(rpb_minus_rpa)
    }

    fn liq_from_x_y_rp_rng(
        x: Decimal,
        y: Decimal,
        rp: Decimal,
        rpa: Decimal,
        rpb: Decimal,
    ) -> Decimal {
        // L : liquidity amount from real reserves based on where price is compared to price range
        //    x,y : real token reserves ; rP : current root price
        //    rPa,rPb : range lower (upper) bound in root price
        if rp.lte(rpa).unwrap() {
            // y = 0 and reserves entirely in x. [4]
            return Self::liq_x_only(x, rpa, rpb);
        } else if rp.lt(rpb).unwrap() {
            // [11,12]
            // x covers sub-range [P,Pb] and y covers the other side [Pa,P]
            let lx = Self::liq_x_only(x, rp, rpb);
            let ly = Self::liq_y_only(y, rpa, rp);
            // Lx Ly should be close to equal, by precaution take the minimum
            lx.min(ly)
        } else {
            // x = 0 and reserves entirely in y. [8]
            Self::liq_y_only(y, rpa, rpb)
        }
    }

    fn liq_from_x_y_tick_rng(x: Decimal, y: Decimal, t: u128, ta: u128, tb: u128) -> Decimal {
        // tick as inputs instead of root prices
        let rp = Self::tick_to_rp(t);
        let rpa = Self::tick_to_rp(ta);
        let rpb = Self::tick_to_rp(tb);
        Self::liq_from_x_y_rp_rng(x, y, rp, rpa, rpb)
    }

    fn x_from_l_rp_rng(l: Decimal, rp: Decimal, rpa: Decimal, rpb: Decimal) -> Decimal {
        // calculate X amount from L, price and bounds
        // if the price is outside the range, use range endpoints instead [11]

        let rp = rp.min(rpb).max(rpa);

        let rpb_minus_rp = rpb.sub(rp).unwrap();
        let rp_mul_rpb = rp.mul(rpb);

        // l * (rpb - rp) / (rp * rpb)
        l.mul(rpb_minus_rp).div(rp_mul_rpb)
    }

    fn x_from_l_tick_rng(l: Decimal, t: u128, ta: u128, tb: u128) -> Decimal {
        // tick as inputs instead of root prices
        let rp = Self::tick_to_rp(t);
        let rpa = Self::tick_to_rp(ta);
        let rpb = Self::tick_to_rp(tb);
        Self::x_from_l_rp_rng(l, rp, rpa, rpb)
    }

    fn y_from_l_rp_rng(l: Decimal, rp: Decimal, rpa: Decimal, rpb: Decimal) -> Decimal {
        // calculate Y amount from L, price and bounds
        // if the price is outside the range, use range endpoints instead [11]
        let rp = rp.min(rpb).max(rpa);

        // l * (rp - rpa) //* should always be positive
        let rp_minus_rpa = rp.sub(rpa).unwrap();
        if rp_minus_rpa.negative {
            panic!("liq_x_only:rpb_minus_rpa should always be positive");
        }
        l.mul(rp_minus_rpa)
    }

    fn y_from_l_tick_rng(l: Decimal, t: u128, ta: u128, tb: u128) -> Decimal {
        // tick as inputs instead of root prices
        let rp = Self::tick_to_rp(t);
        let rpa = Self::tick_to_rp(ta);
        let rpb = Self::tick_to_rp(tb);
        Self::y_from_l_rp_rng(l, rp, rpa, rpb)
    }

    fn rpa_from_l_rp_y(l: Decimal, rp: Decimal, y: Decimal) -> Decimal {
        // lower bound from L, price and y amount [13]
        // rp - (y / l)
        let y_div_l = y.div(l);
        let rez = rp.sub(y_div_l).unwrap();
        if rez.negative {
            panic!("rpa_from_l_rp_y : rp - (y/l) should always be positive");
        }
        rez
    }

    fn rpb_from_l_rp_x(l: Decimal, rp: Decimal, x: Decimal) -> Decimal {
        // upper bound from L, price and x amount [14]
        // l * rp / (l - rp * x)
        let rp_mul_x = rp.mul(x);
        let denom = l.sub(rp_mul_x).unwrap();

        let rez = l.mul(rp).div(denom);
        if rez.negative {
            panic!("rpb_from_l_rp_x : (l - rp * x) should always be positive");
        }
        rez
    }

    fn rpa_from_x_y_rp_rpb(x: Decimal, y: Decimal, rp: Decimal, rpb: Decimal) -> Decimal {
        // lower bound from x, y amounts, price and upper bound [15]
        // y / (rpb * x) + rp - y / (rp * x)
        let rpb_mul_x = rpb.mul(x);
        let first_term = y.div(rpb_mul_x);
        let rp_mul_x = rp.mul(x);
        let last_term = y.div(rp_mul_x);

        let rez = first_term.add(rp).unwrap().sub(last_term).unwrap();
        if rez.negative {
            panic!(
                "rpa_from_x_y_rp_rpb : y / (rpb * x) + rp - y / (rp * x) should always be positive"
            );
        }
        rez
    }

    fn rpb_from_x_y_rp_rpa(x: Decimal, y: Decimal, rp: Decimal, rpa: Decimal) -> Decimal {
        // upper bound from x, y amounts, price and lower bound [16]
        // (rp * y) / ((rpa - rp) * rp * x + y)
        let numer = rp.mul(y);
        let rp_minus_rpa = rp.sub(rpa).unwrap();
        if rp_minus_rpa.negative {
            panic!("rpb_from_x_y_rp_rpa: rpb_minus_rpa should always be positive");
        }
        let d1 = rp_minus_rpa.mul(rp).mul(x); // d1 shoud be positive

        let denom = y.sub(d1).unwrap();
        if rp_minus_rpa.negative {
            panic!("rpb_from_x_y_rp_rpa: denom should always be positive");
        }
        numer.div(denom)
    }

    fn dx_from_l_drp(l: Decimal, rp_old: Decimal, rp_new: Decimal) -> Decimal {
        // Change of reserve X based of change of price
        // l * (1.0 / rp_new - 1.0 / rp_old) = l * (rp_old - rp_new) / (rp_old * rp_new)
        //? this way of calculating needs to be consistent with x_from_l_rp_rng
        //? so use latter (single division) not former with inverses
        let diff = rp_old.sub(rp_new).unwrap();
        let old_mul_new = rp_old.mul(rp_new);

        l.mul(diff).div(old_mul_new)
    }

    fn dy_from_l_drp(l: Decimal, rp_old: Decimal, rp_new: Decimal) -> Decimal {
        // Change of reserve Y based of change of price
        // l * (rp_new - rp_old)
        rp_new.sub(rp_old).unwrap().mul(l)
    }

    fn dx_from_l_drp_hmm(
        l: Decimal,
        rp_old: Decimal,
        rp_new: Decimal,
        c: Decimal,
        rp_oracle: Decimal,
    ) -> Decimal {
        // chg of reserve x based of chg of price with hmm adj
        let one = Self::one();
        if c.to_compute_scale().lt(one).unwrap() {
            panic!("cannot handle hmm with C<1");
        }
        if rp_old.eq(rp_new).unwrap() {
            return Self::zero();
        }
        if c.to_compute_scale().eq(one).unwrap() {
            // return l / rp_oracle * (rp_old / rp_new).ln();
            let ln_rp_old = rp_old.ln().unwrap();
            let ln_rp_new = rp_new.ln().unwrap();
            let log_of_ratio = ln_rp_old.sub(ln_rp_new).unwrap();

            return l.div(rp_oracle).mul(log_of_ratio);
        } else {
            // let omc = 1.0 - c; // one minus c
            // let cmo = -omc; // c minus one
            // return l / rp_oracle.powf(c) * (rp_new.powf(cmo) - rp_old.powf(cmo)) / omc;
            let cmo = c.sub(one).unwrap();
            let omc = cmo.neg();
            let rp_oracle_pow_c = rp_oracle.pow(c);
            let rp_new_pow_cmo = rp_new.pow(cmo);
            let rp_old_pow_cmo = rp_old.pow(cmo);

            let diff = rp_new_pow_cmo.sub(rp_old_pow_cmo).unwrap();

            return l.div(rp_oracle_pow_c).mul(diff).div(omc);
        }
    }

    fn dy_from_l_drp_hmm(
        l: Decimal,
        rp_old: Decimal,
        rp_new: Decimal,
        c: Decimal,
        rp_oracle: Decimal,
    ) -> Decimal {
        // chg of reserve y based of chg of price with hmm adj
        let one = Self::one();
        if c.to_compute_scale().lt(one).unwrap() {
            panic!("cannot handle hmm with C<1");
        }
        if rp_old.eq(rp_new).unwrap() {
            return Self::zero();
        }
        if c.to_compute_scale().eq(one).unwrap() {
            // l * rp_oracle * (rp_old / rp_new).ln()
            let ln_rp_old = rp_old.ln().unwrap();
            let ln_rp_new = rp_new.ln().unwrap();
            let log_of_ratio = ln_rp_old.sub(ln_rp_new).unwrap();

            return l.mul(rp_oracle).mul(log_of_ratio);
        } else {
            // let omc = 1.0 - c; // one minus c
            // l * rp_oracle.powf(c) * (1.0/rp_new.powf(cmo) - 1.0/ rp_old.powf(cmo)) / omc
            let cmo = c.sub(one).unwrap();
            let omc = cmo.neg();

            let rp_oracle_pow_c = rp_oracle.pow(c);
            let rp_new_pow_cmo = rp_new.pow(cmo);
            let rp_old_pow_cmo = rp_old.pow(cmo);

            let inv_rp_new_pow_cmo = one.div(rp_new_pow_cmo);
            let inv_rp_old_pow_cmo = one.div(rp_old_pow_cmo);

            let diff = inv_rp_new_pow_cmo.sub(inv_rp_old_pow_cmo).unwrap();

            return l.mul(rp_oracle_pow_c).mul(diff).div(omc);
        }
    }

    fn rp_new_from_l_dx(l: Decimal, rp_old: Decimal, dx: Decimal) -> Decimal {
        // new price based of change of reserve x //*always positive
        // drp_inv = dx / l = (1/rp_new - 1/rp_old)
        // after solving for rp_new: rp_new = (l * rp_old) / (dx*rp_old + l)

        let numerator = l.mul(rp_old);
        let denom = dx.mul(rp_old).add(l).unwrap();

        let rez = numerator.div(denom);
        if rez.negative {
            panic!("rp_new_from_l_dx : should always be positive");
        }
        rez
    }

    fn rp_new_from_l_dy(l: Decimal, rp_old: Decimal, dy: Decimal) -> Decimal {
        // new price based of change of reserve y //*always positive
        // dy / l + rp_old
        let rez = dy.div(l).add(rp_old).unwrap();
        if rez.negative {
            panic!("rp_new_from_l_dy : should always be positive");
        }
        rez
    }
}
