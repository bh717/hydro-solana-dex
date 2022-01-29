// numbers in square brackets in the comments (e.g. [5] refer to a formula in relevant paper )

pub trait PoolMath {
    const TICK_BASE: f64 = 1.0001;
    const ADJ_WHOLE_FILL: f64 = 1.0e-12;
    const ADJ_WITHDRAWAL: f64 = 1.0e-12;
    const FLOOR_LIQ: bool = true;

    fn tick_to_rp(tick: u32) -> f64 {
        Self::TICK_BASE.sqrt().powf(tick as f64)
    }

    fn rp_to_tick(rp: f64, left_to_right: bool) -> u32 {
        let base = Self::TICK_BASE.sqrt();
        match left_to_right {
            true => rp.log(base).ceil() as u32,
            false => rp.log(base).floor() as u32,
        }
    }

    fn tk_to_possible_tk(tick: u32, spacing: u32, left_to_right: bool) -> u32 {
        // use tk_spacing to find allowable/ initializable tick that is <= tick
        // (if left_to_right is false) or >= tick (if left_to_right is true)
        // returns unchanged tick if self.tick_spacing is 1
        let ts = spacing as f64;
        let tk = tick as f64;
        let result = match left_to_right {
            false => (tk / ts).floor() * ts,
            true => (tk / ts).ceil() * ts,
        };
        result as u32
    }

    fn rp_to_possible_tk(rp: f64, spacing: u32, left_to_right: bool) -> u32 {
        // find allowable tick from given rp
        let tick_theo = Self::rp_to_tick(rp, left_to_right);
        Self::tk_to_possible_tk(tick_theo, spacing, left_to_right)
    }

    fn liq_x_only(x: f64, rpa: f64, rpb: f64) -> f64 {
        // Lx : liquidity amount when liquidity fully composed of  token x
        // e.g when price below lower bound of range and y=0. [5]
        // x : token x real reserves; rPa,rPb : range lower (upper) bound in root price
        x * rpa * rpb / (rpb - rpa)
    }

    fn liq_y_only(y: f64, rpa: f64, rpb: f64) -> f64 {
        // Ly : liquidity amount when liquidity fully composed of  token y
        // e.g when price above upper bound of range, x=0. [9]
        //    y : token y real reserves;  rPa,rPb : range lower (upper) bound in root price
        y / (rpb - rpa)
    }

    fn liq_from_x_y_rp_rng(x: f64, y: f64, rp: f64, rpa: f64, rpb: f64) -> f64 {
        // L : liquidity amount from real reserves based on where price is compared to price range
        //    x,y : real token reserves ; rP : current root price
        //    rPa,rPb : range lower (upper) bound in root price
        if rp <= rpa {
            // y = 0 and reserves entirely in x. [4]
            return Self::liq_x_only(x, rpa, rpb);
        } else if rp < rpb {
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

    fn liq_from_x_y_tick_rng(x: f64, y: f64, t: u32, ta: u32, tb: u32) -> f64 {
        // tick as inputs instead of root prices
        let rp = Self::tick_to_rp(t);
        let rpa = Self::tick_to_rp(ta);
        let rpb = Self::tick_to_rp(tb);
        Self::liq_from_x_y_rp_rng(x, y, rp, rpa, rpb)
    }

    fn x_from_l_rp_rng(l: f64, rp: f64, rpa: f64, rpb: f64) -> f64 {
        // calculate X amount from L, price and bounds
        // if the price is outside the range, use range endpoints instead [11]
        let rp = rp.min(rpb).max(rpa);
        l * (rpb - rp) / (rp * rpb)
    }

    fn x_from_l_tick_rng(l: f64, t: u32, ta: u32, tb: u32) -> f64 {
        // tick as inputs instead of root prices
        let rp = Self::tick_to_rp(t);
        let rpa = Self::tick_to_rp(ta);
        let rpb = Self::tick_to_rp(tb);
        Self::x_from_l_rp_rng(l, rp, rpa, rpb)
    }

    fn y_from_l_rp_rng(l: f64, rp: f64, rpa: f64, rpb: f64) -> f64 {
        // calculate Y amount from L, price and bounds
        // if the price is outside the range, use range endpoints instead [11]
        let rp = rp.min(rpb).max(rpa);
        l * (rp - rpa)
    }
    fn y_from_l_tick_rng(l: f64, t: u32, ta: u32, tb: u32) -> f64 {
        // tick as inputs instead of root prices
        let rp = Self::tick_to_rp(t);
        let rpa = Self::tick_to_rp(ta);
        let rpb = Self::tick_to_rp(tb);
        Self::y_from_l_rp_rng(l, rp, rpa, rpb)
    }

    fn rpa_from_l_rp_y(l: f64, rp: f64, y: f64) -> f64 {
        // lower bound from L, price and y amount [13]
        rp - (y / l)
    }

    fn rpb_from_l_rp_x(l: f64, rp: f64, x: f64) -> f64 {
        // upper bound from L, price and x amount [14]
        l * rp / (l - rp * x)
    }

    fn rpa_from_x_y_rp_rpb(x: f64, y: f64, rp: f64, rpb: f64) -> f64 {
        // lower bound from x, y amounts, price and upper bound [15]
        y / (rpb * x) + rp - y / (rp * x)
    }

    fn rpb_from_x_y_rp_rpa(x: f64, y: f64, rp: f64, rpa: f64) -> f64 {
        // upper bound from x, y amounts, price and lower bound [16]
        (rp * y) / ((rpa - rp) * rp * x + y)
    }

    fn dx_from_l_drp(l: f64, rp_old: f64, rp_new: f64) -> f64 {
        // Change of reserve X based of change of price
        l * (1.0 / rp_new - 1.0 / rp_old)
    }

    fn dy_from_l_drp(l: f64, rp_old: f64, rp_new: f64) -> f64 {
        // Change of reserve Y based of change of price
        l * (rp_new - rp_old)
    }

    fn dx_from_l_drp_hmm(l: f64, rp_old: f64, rp_new: f64, c: f64, rp_oracle: f64) -> f64 {
        // chg of reserve x based of chg of price with hmm adj
        if c == 1.0 {
            return l / rp_oracle * (rp_old / rp_new).ln();
        } else {
            let omc = 1.0 - c; // one minus c
            let cmo = -omc; // c minus one
            return l / rp_oracle.powf(c) * (rp_new.powf(cmo) - rp_old.powf(cmo)) / omc;
        }
    }

    fn dy_from_l_drp_hmm(l: f64, rp_old: f64, rp_new: f64, c: f64, rp_oracle: f64) -> f64 {
        // chg of reserve y based of chg of price with hmm adj
        if c == 1.0 {
            l * rp_oracle * (rp_old / rp_new).ln()
        } else {
            let omc = 1.0 - c; // one minus c
            l * rp_oracle.powf(c) * (rp_new.powf(omc) - rp_old.powf(omc)) / omc
        }
    }

    fn rp_new_from_l_dx(l: f64, rp_old: f64, dx: f64) -> f64 {
        // new price based of change of reserve x
        let drp_inv = dx / l;
        1.0 / (drp_inv + 1.0 / rp_old)
    }

    fn rp_new_from_l_dy(l: f64, rp_old: f64, dy: f64) -> f64 {
        // new price based of change of reserve y
        dy / l + rp_old
    }
}
