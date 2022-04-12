#![allow(dead_code)]
pub mod cl_components;
pub mod cl_math;
// pub mod hydra_math_legacy;

pub use cl_components::{
    GetInRangeOutput, GlobalState, PoolToken, PositionState, SwapOutput, SwapWithinResult,
    TickState,
};

pub use cl_math::PoolMath;
use hydra_math_rs::decimal::{Add, Compare, Decimal, Div, Mul, Pow, Sub};
use std::{
    collections::{BTreeMap, HashMap},
    ops::Neg,
};

#[derive(Debug, PartialEq, Eq, Hash)]
pub struct PositionKey<'a>(&'a str, u128, u128);

#[derive(Debug)]
pub struct Pool<'a> {
    token_x: PoolToken<'a>,
    token_y: PoolToken<'a>,
    tick_spacing: u128,
    global_state: GlobalState,
    active_ticks: BTreeMap<u128, TickState>, // keep ordered
    positions: HashMap<PositionKey<'a>, PositionState>,
    x: Decimal,
    y: Decimal,
    x_adj: Decimal,
    y_adj: Decimal,
    x_fee: Decimal,
    y_fee: Decimal,
    c: Decimal,
    fee_rate: Decimal,
}

impl PoolMath for Pool<'_> {}

impl<'a> Pool<'a> {
    pub fn new(
        x_name: &'a str,
        x_decimals: u8,
        y_name: &'a str,
        y_decimals: u8,
        bootstrap_rp: Decimal,
        tick_spacing: u128,
        hmm_c: Decimal,
        fee_rate: Decimal,
    ) -> Pool<'a> {
        if bootstrap_rp.is_negative() {
            panic!("cannot bootstrap with negative root-price");
        }
        if hmm_c.is_negative()
            || hmm_c
                .to_compute_scale()
                .gt(Decimal::two().to_compute_scale())
                .unwrap()
        {
            panic!("hmm_c needs to be between 0 and 2");
        }
        if fee_rate.is_negative() {
            panic!("fee_rate cannot be with negative");
        }

        let tk = Self::rp_to_possible_tk(bootstrap_rp, tick_spacing, false, 0);
        let rp = Self::tick_to_rp(tk);

        Pool {
            token_x: PoolToken::new(x_name, x_decimals),
            token_y: PoolToken::new(y_name, y_decimals),
            tick_spacing,
            global_state: GlobalState::new(
                Self::zero(),
                rp,
                tk,
                Self::zero(),
                Self::zero(),
                Self::zero(),
                Self::zero(),
            ),
            active_ticks: BTreeMap::new(),
            positions: HashMap::new(),
            x: Self::zero(),
            y: Self::zero(),
            x_adj: Self::zero(),
            y_adj: Self::zero(),
            x_fee: Self::zero(),
            y_fee: Self::zero(),
            c: hmm_c,
            fee_rate,
        }
    }

    pub fn position_count(&self) -> usize {
        self.positions.len()
    }
    pub fn tick_count(&self) -> usize {
        self.active_ticks.len()
    }
    pub fn x_info(&self) -> (Decimal, Decimal, Decimal) {
        (self.x, self.x_adj, self.x_fee)
    }
    pub fn y_info(&self) -> (Decimal, Decimal, Decimal) {
        (self.y, self.y_adj, self.y_fee)
    }
    pub fn glbl_liq(&self) -> Decimal {
        self.global_state.liq()
    }
    pub fn add_glbl_liq(&mut self, liq_to_add: Decimal) {
        self.global_state.add_liq(liq_to_add);
    }
    pub fn glbl_tick(&self) -> u128 {
        self.global_state.tick()
    }
    pub fn set_glbl_tick(&mut self, tick: u128) {
        self.global_state.set_tick(tick);
    }
    pub fn glbl_rp(&self) -> Decimal {
        self.global_state.rp()
    }
    pub fn set_glbl_rp(&mut self, rp: Decimal) {
        self.global_state.set_rp(rp)
    }

    pub fn glbl_fee(&self, token: char, f_or_h: char) -> Decimal {
        self.global_state.fee(token, f_or_h)
    }
    pub fn set_fee_glbl(&mut self, token: char, f_or_h: char, fee: Decimal) {
        self.global_state.set_fee(token, f_or_h, fee)
    }
    pub fn glbl_fees(&self) -> (Decimal, Decimal, Decimal, Decimal) {
        self.global_state.all_fees()
    }

    fn tick_to_possible_tick(&self, tick: u128, left_to_right: bool) -> u128 {
        // use tick_spacing to find allowable/ initializable tick that is <= tick
        // (if left_to_right is false) or >= tick (if left_to_right is true)
        // returns unchanged tick if self.tick_spacing is 1
        Self::tk_to_possible_tk(tick, self.tick_spacing, left_to_right)
    }

    fn rp_to_possible_tick(&self, rp: Decimal, left_to_right: bool, start: u128) -> u128 {
        // find allowable tick from given rp
        Self::rp_to_possible_tk(rp, self.tick_spacing, left_to_right, start)
    }

    fn initialize_tick(&mut self, tick: u128) {
        // set f0 of tick based on convention [6.21]
        let (f0_x, f0_y, h0_x, h0_y) = if self.glbl_tick() >= tick {
            self.glbl_fees()
        } else {
            (Self::zero(), Self::zero(), Self::zero(), Self::zero())
        };

        let ts = TickState::new(Self::zero(), Self::zero(), f0_x, f0_y, h0_x, h0_y);
        self.active_ticks.insert(tick, ts);
    }

    fn unset_tick(&mut self, tick: u128) {
        self.active_ticks.remove(&tick);
    }

    fn update_tick(&mut self, tick: u128, liq_delta: Decimal, upper: bool) {
        // Update specific tick's liquidity delta for specific tick
        // get the tick state for tick if exists, else initialize one
        if self.active_ticks.get(&tick).is_none() {
            self.initialize_tick(tick);
        }
        let ts = self.active_ticks.get_mut(&tick).unwrap();

        let liq_net_to_add = match upper {
            false => liq_delta,
            true => liq_delta.neg(),
        };
        ts.add_liq_net(liq_net_to_add);
        ts.add_liq_gross(liq_delta);

        if ts.liq_gross().is_zero() {
            // de-initialize tick when no longer ref'ed by a position
            self.unset_tick(tick);
        }
    }

    fn cross_tick(&mut self, provided_tick: u128, left_to_right: bool) {
        // Handle update of global state and tick state when initialized tick is crossed
        // while performing swap
        if !left_to_right && self.glbl_tick() != provided_tick {
            panic!("can only cross current tick");
        }
        let (fg_x, fg_y, hg_x, hg_y) = self.glbl_fees();

        let ts = self
            .active_ticks
            .get_mut(&provided_tick)
            .expect("cannot find tick for crossing");

        // add/substract to glabal liq depending on direction of crossing
        let liq_to_apply = match left_to_right {
            true => ts.liq_net(),
            false => ts.liq_net().neg(),
        };

        // update tick state by flipping fee growth outside f0_X_Y [6.26]
        let (f0_x, f0_y, h0_x, h0_y) = ts.all_fees();
        ts.set_fee('x', 'f', fg_x.sub(f0_x).unwrap());
        ts.set_fee('y', 'f', fg_y.sub(f0_y).unwrap());
        ts.set_fee('x', 'h', hg_x.sub(h0_x).unwrap());
        ts.set_fee('y', 'h', hg_y.sub(h0_y).unwrap());
        // TODO: do the same for s0, i0, sl0 in Tick-state

        // update current tick in global state to reflect crossing; rP unchanged
        if left_to_right {
            self.set_glbl_tick(provided_tick);
        } else {
            self.set_glbl_tick(self.tick_to_possible_tick(provided_tick - 1, left_to_right))
        }

        // adjust global liquidity
        self.add_glbl_liq(liq_to_apply);
    }

    fn get_left_limit_of_swap_within(&self, start_t: u128) -> Option<u128> {
        // get next available active tick from a starting point going left
        let tick = self.tick_to_possible_tick(start_t.min(self.glbl_tick()), false);
        for tk in self.tick_keys_cloned(true) {
            // descending
            if tk <= tick {
                // case when  starting_rP equals exactly tick_torP(current tick)
                // is covered in swap method (will do 0-qty and trigger cross)
                return Some(tk);
            }
            continue; // ignore ticks above current tick
        }
        None
    }

    fn get_right_limit_of_swap_within(&self, start_t: u128, glbl_tick: u128) -> Option<u128> {
        // get next available active tick from a starting point going right
        // this function is to determine the limit of a swap_within_from_Y
        // Caution not to use for cross_tick

        // get to initializable tick. we use False here to round down
        let start_tick = self.tick_to_possible_tick(start_t, false);

        if start_tick == glbl_tick {
            // we've already technically crossed this tick (left-to-right) i.e.
            // the liquidity corresponding to this tick [start_tick, next_tick)
            // is already in range. We are looking for the 1st active tick
            // strictly superior to it.
            for tk in self.tick_keys_cloned(false) {
                // ascending
                if tk > start_tick {
                    return Some(tk);
                }
                continue; // ignore current tick and below
            }
        } else if start_tick > glbl_tick {
            // the global rP has already travelled to the tick above the
            // current global tick (WITHOUT CROSSING over it left to right)
            // so liqudity-wise we are still in the range of current_tick
            // in this case we are looking for the 1st active tick
            // above AND possibly INCLUDING start_tick. If start_tick is indeed
            // part of active_ticks, the very next swap_within_from_Y will
            // result in a 0_qty swap and trigger a crossing to the right
            for tk in self.tick_keys_cloned(false) {
                // ascending
                if tk >= start_tick {
                    return Some(tk);
                }
                continue; // ignore current tick and below
            }
        } else {
            panic!("we do not expect global rP to ever be strictly below current global tick");
        }
        None
    }

    pub fn tick_keys_cloned(&self, reverse: bool) -> Vec<u128> {
        match reverse {
            // true => Vec::from_iter(self.active_ticks.keys().rev().map(|&x| x)),
            // false => Vec::from_iter(self.active_ticks.keys().map(|&x| x)),
            true => self.active_ticks.keys().rev().cloned().collect(),
            false => self.active_ticks.keys().cloned().collect(),
        }
    }

    fn try_get_in_range(&mut self, left_to_right: bool) -> GetInRangeOutput {
        // During swap, when no liquidity in current state, find next active tick, cross it  to
        // kick-in some liquidity. return (new_goal_tick or None, glbl_tick and glbl_rP).
        if self.glbl_liq().is_positive() {
            panic!("there already is liquidity in range");
        }

        if !left_to_right {
            // going right to left, X in Y out
            for tk in self.tick_keys_cloned(true) {
                // descending
                if tk > self.glbl_tick() {
                    continue; // ignore ticks above current tick
                }
                self.set_glbl_tick(tk);
                self.set_glbl_rp(Self::tick_to_rp(tk));
                self.cross_tick(tk, left_to_right);
                // crossing shud put glbl_state.tick 1 (possible) tick under tk
                // set the next goal for swap
                let new_goal = self.get_left_limit_of_swap_within(self.glbl_tick());
                // at this point some Liquidity should have kicked in
                if self.glbl_liq().is_negative() {
                    //? we shouldn't hit this as GlobalState should have panicked when trying
                    //? to set negative liq on the tick crossing above
                    panic!(
                        "from being out of range, we don't expect to kick in negative liquidity"
                    );
                }
                if self.glbl_liq().is_positive() {
                    // * return next goal (1 tick under tk) and tk just crossed
                    return GetInRangeOutput::new(new_goal, self.glbl_rp());
                }
            }
        } else {
            for tk in self.tick_keys_cloned(false) {
                // ascending
                if tk <= self.glbl_tick() {
                    continue; // ignore ticks above current tick
                }
                self.set_glbl_tick(tk);
                self.set_glbl_rp(Self::tick_to_rp(tk));
                self.cross_tick(tk, left_to_right);
                // at this point some Liquidity should have kicked in
                // now find the new goal_tick to be passed to swap_within()
                let new_goal = self.get_right_limit_of_swap_within(tk, tk);

                if self.glbl_liq().is_negative() {
                    //? we shouldn't hit this as GlobalState should have panicked when trying
                    //? to set negative liq on the tick crossing above
                    panic!("from being out of rng, we don't expect to kick in negative liquidity");
                }
                if self.glbl_liq().is_positive() {
                    // * return next goal and tk just crossed (==global_st tick)
                    return GetInRangeOutput::new(new_goal, self.glbl_rp());
                }
            }
        }
        return GetInRangeOutput::new(None, self.glbl_rp());
    }

    //+ DEPOSITS AND WITHDRAWALS
    fn fee_below_above(&self, tick: u128, token: char, f_or_h: char) -> (Decimal, Decimal) {
        // Fees earned in a token below and above tick, as tuple.
        // can compute for either token: X if 'for_x' is true, else Y
        // & for either swap fees or hmm fees: swap fees id 'swp' is true else hmm fees)
        let i_c = self.glbl_tick();
        let fg = self.glbl_fee(token, f_or_h);
        let ts = self.active_ticks.get(&tick);

        match ts {
            None => (fg, Self::zero()), // from [6.17 - 6.21], convention
            Some(ts) => {
                let f0 = ts.fee(token, f_or_h);
                let f_below = match i_c >= tick {
                    true => f0,
                    false => fg.sub(f0).unwrap(),
                }; // [6.18]
                let f_above = match i_c >= tick {
                    true => fg.sub(f0).unwrap(),
                    false => f0,
                }; // [6.17]
                (f_below, f_above)
            }
        }
    }

    fn fee_rng(&self, lower_tick: u128, upper_tick: u128, token: char, f_or_h: char) -> Decimal {
        // Fees earned (per unit of liq) within a range of ticks (e.g. by a position)
        let (f_blw_lwr, f_abv_lwr) = self.fee_below_above(lower_tick, token, f_or_h);
        let (f_blw_upr, f_abv_upr) = self.fee_below_above(upper_tick, token, f_or_h);

        // retrieve fg by summing up either tuple, they should match
        let sum_lwr = f_blw_lwr.add(f_abv_lwr).unwrap();
        let sum_upr = f_blw_upr.add(f_abv_upr).unwrap();
        assert_eq!(sum_lwr, sum_upr);
        let fg = sum_lwr;

        let fee_earned = fg.sub(f_blw_lwr).unwrap().sub(f_abv_upr).unwrap();
        if fee_earned.is_negative() {
            panic!("fees earned cannot be negative");
        }

        fee_earned
    }

    fn _set_position(
        &mut self,
        user_id: &'a str,
        lower_tick: u128,
        upper_tick: u128,
        liq_delta: Decimal,
    ) -> (Decimal, Decimal, Decimal, Decimal) {
        // handles all facets for updates a position for in the pool,
        // used for deposits (l>0), withdrawals (l<0)
        // compute uncollected fees f_u the poz is entitled to: first compute new FeeGrowthInside,
        // to be written to position will be set to 0 by function if tick not initialized
        let new_fr_x = self.fee_rng(lower_tick, upper_tick, 'x', 'f');
        let new_fr_y = self.fee_rng(lower_tick, upper_tick, 'y', 'f');
        let new_hr_x = self.fee_rng(lower_tick, upper_tick, 'x', 'h');
        let new_hr_y = self.fee_rng(lower_tick, upper_tick, 'y', 'h');

        // then get old fee value from when position was last touched.(set below)
        // set to 0 as default for when new position
        let mut old_fr_x = Self::zero();
        let mut old_fr_y = Self::zero();
        let mut old_hr_x = Self::zero();
        let mut old_hr_y = Self::zero();
        // liquidity to use for computing fee amounts (set below)
        let mut base = Self::zero();

        // find position if exists
        // positions are uniquely identitfied by the (sender, lower, upper)
        let key = PositionKey(user_id, lower_tick, upper_tick);

        match self.positions.get_mut(&key) {
            None => {
                if liq_delta.is_negative() {
                    // abort if withdrawal liq exceeds position liquidity
                    panic!("cannot newly provide negative liquidity");
                }
                self.positions.insert(
                    key,
                    PositionState::new(
                        liq_delta,
                        Self::zero(),
                        Self::zero(),
                        Self::zero(),
                        Self::zero(),
                    ),
                );
            }
            Some(poz) => {
                // get old value for feed from when position was last touched
                let (fr_x, fr_y, hr_x, hr_y) = poz.all_fees();
                old_fr_x = fr_x;
                old_fr_y = fr_y;
                old_hr_x = hr_x;
                old_hr_y = hr_y;
                base = poz.liq();
                if base.is_negative() {
                    //? just in case, shudnt be hit due to PositionState validation
                    panic!("position liquidity should not be negative ");
                }

                // update existing position
                let new_liq = base.add(liq_delta).unwrap();
                if liq_delta.is_negative() && new_liq.is_negative() {
                    // abort if withdrawal liq exceeds position liquidity
                    panic!("liquidity is position insufficient");
                }
                if new_liq.is_zero() {
                    // if position liq becomes 0 after operation remove from pool
                    self.positions.remove(&key);
                } else {
                    poz.add_liq(liq_delta);
                    poz.set_fee('x', 'f', new_fr_x);
                    poz.set_fee('y', 'f', new_fr_y);
                    poz.set_fee('x', 'h', new_hr_x);
                    poz.set_fee('y', 'h', new_hr_y);
                }
            }
        }
        // now calulate uncollected fees to be applied to deposit/withdrawal
        let (f_u_x, f_u_y) = (
            new_fr_x.sub(old_fr_x).unwrap(),
            new_fr_y.sub(old_fr_y).unwrap(),
        );
        let (h_u_x, h_u_y) = (
            new_hr_x.sub(old_hr_x).unwrap(),
            new_hr_y.sub(old_hr_y).unwrap(),
        );
        assert!(!f_u_x.is_negative(), "fees earned cannot be negative");
        assert!(!f_u_y.is_negative(), "fees earned cannot be negative");
        assert!(!h_u_x.is_negative(), "fees earned cannot be negative");
        assert!(!h_u_y.is_negative(), "fees earned cannot be negative");

        // update tick states for lower and upper
        self.update_tick(lower_tick, liq_delta, false);
        self.update_tick(upper_tick, liq_delta, true);

        // update global state's liquidity if current price in poz's range
        if self.glbl_tick() >= lower_tick && self.glbl_tick() < upper_tick {
            self.add_glbl_liq(liq_delta);
        }
        // return uncollected fee amounts to offset/add in deposit/withdrawal
        (
            base.mul(f_u_x),
            base.mul(f_u_y),
            base.mul(h_u_x),
            base.mul(h_u_y),
        )
    }

    pub fn deposit(
        &mut self,
        user_id: &'a str,
        x: Decimal,
        y: Decimal,
        rpa: Decimal,
        rpb: Decimal,
    ) {
        // interface to deposit liquidity in pool & give change if necessary

        // sign check. leave possibility of zero deposit
        // zero deposits are equivalent to fees claiming without changing position
        assert!(!x.is_negative(), "can only deposit positive amounts");
        assert!(!y.is_negative(), "can only deposit positive amounts");

        assert!(!rpa.is_negative(), "root-price cannot be negative");
        assert!(!rpb.is_negative(), "root-price cannot be negative");

        // calculate ticks that will be used to track position
        let lower_tick = self.rp_to_possible_tick(rpa, false, 0);
        let upper_tick = self.rp_to_possible_tick(rpb, false, lower_tick);
        assert!(
            upper_tick > lower_tick,
            "upper bound needs to be above lower bound"
        );
        let rpa_used = Pool::tick_to_rp(lower_tick);
        let rpb_used = Pool::tick_to_rp(upper_tick);
        let rp_used = self.glbl_rp();

        // TODO should we use Oracle price here instead? or real price as param
        // ? only when no liquidity in range?

        let mut liq = Pool::liq_from_x_y_rp_rng(x, y, rp_used, rpa_used, rpb_used);
        if liq.is_negative() {
            panic!("negative liquidity on deposit");
        }
        // round down to avoid float rounding vulnerabilities
        // TODO choose what precision to round down to
        if Self::FLOOR_LIQ {
            liq = liq.div(Self::one())
        };

        let x_in = Pool::x_from_l_rp_rng(liq, rp_used, rpa_used, rpb_used);
        if x_in.gt(x).unwrap() {
            panic!("used x amt cannot exceed provided amount");
        }
        let y_in = Pool::y_from_l_rp_rng(liq, rp_used, rpa_used, rpb_used);
        if y_in.gt(y).unwrap() {
            panic!("used y amt cannot exceed provided amount");
        }

        let (fees_x, fees_y, adj_x, adj_y) =
            self._set_position(user_id, lower_tick, upper_tick, liq);

        // offset fee amounts from deposit amounts: this will be the amount debited from user
        let x_debited = x_in.sub(fees_x).unwrap().sub(adj_x).unwrap();
        let y_debited = y_in.sub(fees_y).unwrap().sub(adj_y).unwrap();

        // update state: reserves, fee pot , hmm-adj-fee pot
        if self.x_fee.lt(fees_x).unwrap() || self.y_fee.lt(fees_y).unwrap() {
            panic!("cannot disburse more fees than present in pot");
        }
        if self.x_adj.lt(adj_x).unwrap() || self.y_adj.lt(adj_y).unwrap() {
            panic!("cannot disburse more adj-fees than present in pot");
        }
        self.x = self.x.add(x_in).unwrap();
        self.y = self.y.add(y_in).unwrap();
        self.x_fee = self.x_fee.sub(fees_x).unwrap();
        self.x_adj = self.x_adj.sub(adj_x).unwrap();
        self.y_fee = self.y_fee.sub(fees_y).unwrap();
        self.y_adj = self.y_adj.sub(adj_y).unwrap();

        println!("x_debited={:?} y_debited {:?}", x_debited, y_debited);
        println!(
            "including fees_x+adj_x ={:?} and fees_y+adj_y={:?}",
            fees_x.add(adj_x).unwrap(),
            fees_y.add(adj_y).unwrap()
        );
        println!(
            "X returned {:?} Y returned {:?}",
            x.sub(x_debited).unwrap(),
            y.sub(y_debited).unwrap()
        );
    }

    pub fn withdraw(&mut self, user_id: &'a str, liq: Decimal, rpa: Decimal, rpb: Decimal) {
        // interface to withdraw liquidity from pool

        // sign check . leave possibility of zero withdrawal
        // zero withdrawal are equiivalent to fee-claiming without changing position
        assert!(
            !liq.is_negative(),
            "only positive amount of liquidity can be withdrawn"
        );

        // calculate ticks that will be used to track position
        let lower_tick = self.rp_to_possible_tick(rpa, false, 0);
        let upper_tick = self.rp_to_possible_tick(rpb, false, lower_tick);
        assert!(
            upper_tick > lower_tick,
            "upper bound needs to be above lower bound"
        );
        let rpa_used = Pool::tick_to_rp(lower_tick);
        let rpb_used = Pool::tick_to_rp(upper_tick);

        let (fees_x, fees_y, adj_x, adj_y) =
            self._set_position(user_id, lower_tick, upper_tick, liq.neg());
        let rp_used = self.glbl_rp();

        // TODO should we use Oracle price here instead? or real price as param
        // ? only when no liquidity in range?

        let mut x_out = Pool::x_from_l_rp_rng(liq, rp_used, rpa_used, rpb_used);
        let mut y_out = Pool::y_from_l_rp_rng(liq, rp_used, rpa_used, rpb_used);

        // round down amount withdrawn if necessary, as precation
        let adj_factor = Self::one().sub(Self::adj_withdrawal()).unwrap();
        x_out = x_out.mul(adj_factor);
        y_out = y_out.mul(adj_factor);

        // add fees on top of what user will receive
        let x_sent = x_out.add(fees_x).unwrap().add(adj_x).unwrap();
        let y_sent = y_out.add(fees_y).unwrap().add(adj_y).unwrap();

        // update state: reserves, fee pot , hmm-adj-fee pot
        // first check x_out and y_out are not larger than reserves
        if self.x.lt(x_out).unwrap() || self.y.lt(y_out).unwrap() {
            panic!("cannot withdraw more than reserves");
        }
        if self.x_fee.lt(fees_x).unwrap() || self.y_fee.lt(fees_y).unwrap() {
            panic!("cannot disburse more fees than present in pot");
        }
        if self.x_adj.lt(adj_x).unwrap() || self.y_adj.lt(adj_y).unwrap() {
            panic!("cannot disburse more add-fees than present in pot");
        }
        self.x = self.x.sub(x_out).unwrap();
        self.y = self.y.sub(y_out).unwrap();
        self.x_fee = self.x_fee.sub(fees_x).unwrap();
        self.x_adj = self.x_adj.sub(adj_x).unwrap();
        self.y_fee = self.y_fee.sub(fees_y).unwrap();
        self.y_adj = self.y_adj.sub(adj_y).unwrap();

        println!("x_sent: {:?}, y_sent: {:?}", x_sent, y_sent);
        println!(
            "including fees_x+adj_x ={:?} and fees_y+adj_y={:?}",
            fees_x.add(adj_x).unwrap(),
            fees_y.add(adj_y).unwrap()
        );
    }

    //+ SWAPPING
    fn swap_within_tick_from_x(
        &mut self,
        start_rp: Decimal,
        goal_tick: u128,
        liq: Decimal,
        dx: Decimal,
        rp_oracle: Decimal,
    ) -> SwapWithinResult {
        // portion of swap execution occurring within 2 consecutive active ticks
        // + no writing to state to occurs here, just compute and return to caller
        let (done_dx, end_t, end_rp, cross, hmm_adj_y, fee_x);
        let mut done_dy;

        if dx.is_negative() {
            panic!("can only handle X being supplied to pool, dX>0");
        }

        // root-price at goal tick - here on the left
        let rp_goal = Pool::tick_to_rp(goal_tick);
        if rp_goal.gt(start_rp).unwrap() {
            panic!("expect price to go down when X supplied to pool");
            // we allow case when price exactly on the current tick ( i.e. rP_goal = start_rP)
            // this will lead to 0-qty swapped, and tick-crossing before next swap
        }

        // put aside max potential swap fees before affecting prices
        let fee_factor = Self::one().sub(self.fee_rate).unwrap();
        let dx_max = dx.mul(fee_factor);

        // chg of reserve X possible if we go all the way to goal tick
        let doable_dx = Pool::dx_from_l_drp(liq, start_rp, rp_goal);
        if doable_dx.is_negative() {
            // expect a positive number
            panic!("doable_dX > 0 when X supplied to pool");
        }

        if doable_dx.lt(dx_max).unwrap() {
            // we will have leftover quantity to swap. fill what we can. done_X = doableX
            done_dx = doable_dx;
            // reverse engineer how much fees charged based on how much done_dX
            fee_x = done_dx.div(fee_factor).mul(self.fee_rate);
            cross = true; // because we'll need to cross and do extra swap_withins
            end_t = goal_tick; // swap so far moves price to level at this tick
            end_rp = rp_goal; // ensure use same rP at tick borders, avoid log
        } else {
            // we have enough to fill full quantity. make all dX_max 'done', then calc end_rP
            done_dx = dx_max;
            fee_x = dx.sub(dx_max).unwrap(); // fee as expected
            cross = false;
            end_rp = Pool::rp_new_from_l_dx(liq, start_rp, done_dx);
            end_t = Pool::rp_to_tick_loop(end_rp, false, goal_tick - 1);
            // * this loop happens only once per trade if price ends in-between ticks
            // * tick is always on the left (round down after 'log')

            if end_rp.gt(start_rp).unwrap() {
                panic!("expect end_rP < start_rP when pool given X");
            }
            if end_rp.lt(rp_goal).unwrap() {
                panic!("dont expect end_rP go beyond rP_goal (left) when able to wholy fill dX")
            }
        }
        // now figure out how much done_dY ( done Y quantity) and hmm_adj_Y (hmm related fee)
        let mut done_dy_cpmm = Pool::dy_from_l_drp(liq, start_rp, end_rp);
        if self.c.is_zero() || rp_oracle.is_zero() || rp_oracle.gte(start_rp).unwrap() {
            // also when rP_oracle is None (zero)
            // in cases where no oracle or no hmm c=0, we cannot adjust so we fall back to amm
            // * when trade will make pool price diverge even more from oracle,
            // * then we don't adjust (hmm adjust on convergence only)
            done_dy = done_dy_cpmm;
        } else if rp_oracle.lt(start_rp).unwrap() && rp_oracle.gte(end_rp).unwrap() {
            // 1st part of this condition is redundant as it is implied from precious branch
            // it is left in for precision and readability
            // * when oracle is in between start_rP and end_rP prices, use hmm
            // * till we reach oracle price then use unadjusted amm till we reach end_rP
            let done_dy_1 = Pool::dy_from_l_drp_hmm(liq, start_rp, rp_oracle, self.c, rp_oracle);
            let done_dy_2 = Pool::dy_from_l_drp(liq, rp_oracle, end_rp);
            if done_dy_1.is_positive() || done_dy_2.is_positive() {
                panic!("expect (each component of) done_dY < 0 when X supplied to pool")
            }
            done_dy = done_dy_1.add(done_dy_2).unwrap();
        } else if rp_oracle.lt(end_rp).unwrap() {
            // * when trade will make pool price converge to oracle price
            // * and end_rP won't reach the oracle price
            // * then use hmm all the way
            done_dy = Pool::dy_from_l_drp_hmm(liq, start_rp, end_rp, self.c, rp_oracle);
        } else {
            // we don't expect to hit this. raise error if we do hit
            panic!("HMM adjstment: possibilities should have been exhausted by now");
        }

        // adjust conservatively to avoid rounding issues.
        let adj_factor = Self::one().sub(Self::adj_whole_fill()).unwrap();
        done_dy = done_dy.mul(adj_factor);
        done_dy_cpmm = done_dy_cpmm.mul(adj_factor);

        hmm_adj_y = done_dy.sub(done_dy_cpmm).unwrap();

        if done_dy_cpmm.is_positive() {
            panic!("expect done_dY < 0 when X supplied to pool")
            // again we allow 0-qty swap, just in case price was already
            // exactly on the tick we started with
        }
        if hmm_adj_y.is_negative() {
            panic!("hmm adj should be positive (conservative for pool i.e giving out less)");
        }
        if self.y.add(done_dy_cpmm).unwrap().is_negative() {
            panic!("cannot swap out more Y than present in pool");
        }
        // avoid numerical noise for very small trades relative to liquidity
        if !done_dx.is_zero() && !done_dy.is_zero() {
            let avg_price = done_dy.neg().div(done_dx.add(fee_x).unwrap());
            if avg_price.gt(start_rp.pow(2)).unwrap() {
                panic!("pool cannot buy X at a greater avg price than starting price");
            }
        }

        return SwapWithinResult::new(done_dx, done_dy, end_t, end_rp, cross, hmm_adj_y, fee_x);
    }

    pub fn execute_swap_from_x(&mut self, dx: Decimal, rp_oracle: Decimal) -> SwapOutput {
        //  Swap algo when pool receives dX>0
        //  We go from right to left on the price line (price goes down) and manage tick crossings as needed.
        //  within 2 consecutive active ticks, we delegate to swap_within_tick_from_X(..)
        if !dx.is_positive() {
            // do not allow zero
            panic!("can only handle X being supplied to pool, dX>0");
        }
        let left_to_right = false;

        // get current tick, current root price, and liquidity in range
        let mut curr_t = self.glbl_tick();
        let mut curr_rp = self.glbl_rp();

        // main case: where liquidity_in_range > 0 --> call swap_within_tick_from_X()
        // otherwise try to get soome liquidity into range.
        // repeat till full order filled or pool liquidity dries up, whichever comes first
        let mut swpd_dx = Self::zero();
        let mut swpd_dy = Self::zero();
        let (mut adjusted_dy, mut total_fee_x) = (Self::zero(), Self::zero());
        let (avg_p, end_p);

        while swpd_dx.lt(dx).unwrap() {
            let goal_tick: Option<u128>;
            let (done_dx, done_dy, end_rp, hmm_adj_y, fee_x);
            let (end_t, cross);

            if self.glbl_liq().is_positive() {
                goal_tick = self.get_left_limit_of_swap_within(curr_t);
            } else {
                // try move into range; if not possible then break out to end swap
                println!("Gap in liquidity... trying to get in range...");
                let rez = self.try_get_in_range(left_to_right);
                goal_tick = rez.goal_tick();
                curr_rp = rez.new_rp();
            }

            match goal_tick {
                None => {
                    // there are no more active ticks on the left, terminate swap
                    println!("no more active ticks (liquidity) in this direction");
                    avg_p = match swpd_dx.is_zero() {
                        false => swpd_dy.neg().div(swpd_dx),
                        true => Self::zero(),
                    };
                    end_p = self.glbl_rp().pow(2);
                    println!(
                        "swpd_dX={:?} swpd_dY={:?} pool_X={:?} pool_Y={:?} avg_P={:?}, end_P={:?}",
                        swpd_dx, swpd_dy, self.x, self.y, avg_p, end_p
                    );
                    println!(
                            "adjusted_dY={:?}  pool_cumul_Y_adj={:?} total_fee_X={:?}  pool_cumul_X_fee={:?}",
                            adjusted_dy, self.y_adj, total_fee_x, self.x_fee
                        );
                    return SwapOutput::new(
                        swpd_dx,
                        swpd_dy,
                        adjusted_dy,
                        total_fee_x,
                        avg_p,
                        end_p,
                    );
                }

                Some(gtk) => {
                    let rez = self.swap_within_tick_from_x(
                        curr_rp,
                        gtk,
                        self.glbl_liq(),
                        dx.sub(swpd_dx).unwrap(), //dx - swpd_dx,
                        rp_oracle,
                    );
                    done_dx = rez.recv_amount();
                    done_dy = rez.send_amount();
                    end_t = rez.end_tick();
                    end_rp = rez.end_rp();
                    cross = rez.cross();
                    hmm_adj_y = rez.send_hmm_adj();
                    fee_x = rez.recv_fee();
                    let new_y = self.y.add(done_dy).unwrap().sub(hmm_adj_y).unwrap(); //self.y + done_dy - hmm_adj_y   >=0
                    assert!(!new_y.is_negative(), "cannot swap out more Y than present");
                    let check = dx
                        .sub(swpd_dx)
                        .unwrap()
                        .sub(done_dx)
                        .unwrap()
                        .sub(fee_x)
                        .unwrap();
                    // dx - swpd_dx >= done_dx + fee_x
                    assert!(!check.is_negative(), "cannot fill more X than provided");

                    // update local totals
                    // gross (including fees) for input token: swpd_dx += done_dx + fee_x
                    swpd_dx = swpd_dx.add(done_dx).unwrap().add(fee_x).unwrap();
                    // net total for output token: swpd_dy += done_dy
                    swpd_dy = swpd_dy.add(done_dy).unwrap();
                    adjusted_dy = adjusted_dy.add(hmm_adj_y).unwrap();
                    total_fee_x = total_fee_x.add(fee_x).unwrap();
                    curr_t = end_t;
                    curr_rp = end_rp;

                    // update global state to reflect price change (if any) & reserves
                    self.set_glbl_tick(curr_t);
                    self.set_glbl_rp(curr_rp);
                    self.x = self.x.add(done_dx).unwrap();
                    // hmm_adj comes out of reserves and into fees 'vault' self.y += done_dy - hmm_adj_y
                    self.y = new_y;
                    self.x_fee = self.x_fee.add(fee_x).unwrap();
                    self.y_adj = self.y_adj.add(hmm_adj_y).unwrap();

                    // set fees
                    let liq_glbl = self.glbl_liq();
                    let (fg_x, _, _, hg_y) = self.glbl_fees();
                    if liq_glbl.is_positive() {
                        // make sure not 0 liquidity (empty trade)
                        // * update fee growth to reflect latest swap_within()
                        self.set_fee_glbl('x', 'f', fee_x.div(liq_glbl).add(fg_x).unwrap()); // fg_x + fee_x / liq_g
                        self.set_fee_glbl('y', 'h', hmm_adj_y.div(liq_glbl).add(hg_y).unwrap());
                        // hg_y + hmm_adj_y / liq_glbl);
                    }

                    // perform crossing of tick, if necessary
                    if cross == true {
                        assert!(end_t == gtk);
                        if self.active_ticks.contains_key(&gtk) {
                            self.cross_tick(gtk, left_to_right);
                        }
                    }
                }
            }
        }

        avg_p = match swpd_dx.is_zero() {
            false => swpd_dy.neg().div(swpd_dx),
            true => Self::zero(),
        };
        end_p = self.glbl_rp().pow(2);
        println!(
            "swpd_dX={:?} swpd_dY={:?} pool_X={:?} pool_Y={:?} avg_P={:?}, end_P={:?}",
            swpd_dx, swpd_dy, self.x, self.y, avg_p, end_p
        );
        println!(
            "adjusted_dY={:?}  pool_cumul_Y_adj={:?} total_fee_X={:?}  pool_cumul_X_fee={:?}",
            adjusted_dy, self.y_adj, total_fee_x, self.x_fee
        );
        return SwapOutput::new(swpd_dx, swpd_dy, adjusted_dy, total_fee_x, avg_p, end_p);
    }

    fn swap_within_tick_from_y(
        &mut self,
        start_rp: Decimal,
        goal_tick: u128,
        liq: Decimal,
        dy: Decimal,
        rp_oracle: Decimal,
    ) -> SwapWithinResult {
        // portion of swap execution occurring within 2 consecutive active ticks
        // + no writing to state to occurs here, just calc and return to caller
        let (done_dy, end_t, end_rp, cross, hmm_adj_x, fee_y);
        let mut done_dx;

        if dy.is_negative() {
            panic!("can only handle Y being supplied to pool, dY>0");
        }

        // root-price at goal tick - here on the right
        let rp_goal = Pool::tick_to_rp(goal_tick);
        if rp_goal.lt(start_rp).unwrap() {
            panic!("expect price to go up when Y supplied to pool");
            // we allow case when price exactly on the current tick ( i.e. rP_goal = start_rP)
            // this will lead to 0-qty swapped, and tici-crossing before next swap
        }

        // put aside max potential swap fees before affecting prices
        let fee_factor = Self::one().sub(self.fee_rate).unwrap();
        let dy_max = dy.mul(fee_factor);

        // chg of reserve Y possible if we go all the way to goal tick
        let doable_dy = Pool::dy_from_l_drp(liq, start_rp, rp_goal);
        if doable_dy.is_negative() {
            // expect a positive number
            panic!("doable_dY >= 0 when Y supplied to pool");
        }

        if doable_dy.lt(dy_max).unwrap() {
            // we'll have leftover to swap. do what we can. done_Y = doableY
            done_dy = doable_dy;
            // reverse engineer how much fees charged based on how much done_dY
            fee_y = done_dy.div(fee_factor).mul(self.fee_rate);
            cross = true; // because we'll need to cross and do extra swap_withins
            end_t = goal_tick; // swap so far moves price to level at this tick
            end_rp = rp_goal; // ensure use same rP at tick borders, avoid log
        } else {
            // we have enough to fill full quantity, make all of dY_max 'done', then calc end_rP
            done_dy = dy_max;
            fee_y = dy.sub(dy_max).unwrap(); // fee as expected
            cross = false;
            end_rp = Pool::rp_new_from_l_dy(liq, start_rp, done_dy);
            // start seeking the goal from tick under current tick, that can be initialized
            let seek_start = self.tick_to_possible_tick(self.glbl_tick() - 1, false);
            end_t = Pool::rp_to_tick_loop(end_rp, false, seek_start);
            // * this log is take only once per trade if price ends in-between ticks
            // * tick is always on the left (round down after log)

            if end_rp.lt(start_rp).unwrap() {
                panic!("expect end_rP > start_rP when pool given Y");
            }
            if end_rp.gt(rp_goal).unwrap() {
                panic!("dont expect end_rP go beyond rP_goal (right) when able to wholy fill dY");
            }
        }
        // now figure out how much done_dX and hmm_adj_X
        let mut done_dx_cpmm = Pool::dx_from_l_drp(liq, start_rp, end_rp);

        if self.c.is_zero() || rp_oracle.is_zero() || rp_oracle.lte(start_rp).unwrap() {
            // also also rP_oracle is None (zero)
            // in cases where no oracle or no hmm as c=0, we cannot adjust so we fall back to amm
            // * when trade will make pool price diverge more from oracle,
            // * then we don't adjust (hmm adjust on convergence only)
            done_dx = done_dx_cpmm;
        } else if rp_oracle.gt(start_rp).unwrap() && rp_oracle.lte(end_rp).unwrap() {
            // 1st part of this condition is redundant as it is implied from precious branch.
            // it is added for precision and readability
            // * when oracle is in between start_rP and end_rP prices, use hmm
            // * till we reach oracle price then use unadjusted amm till end_rP
            let done_dx_1 = Pool::dx_from_l_drp_hmm(liq, start_rp, rp_oracle, self.c, rp_oracle);
            let done_dx_2 = Pool::dx_from_l_drp(liq, rp_oracle, end_rp);
            if done_dx_1.is_positive() || done_dx_2.is_positive() {
                panic!("expect (each component of) done_dX < 0 when Y supplied to pool")
            }
            done_dx = done_dx_1.add(done_dx_2).unwrap();
        } else if rp_oracle.gt(end_rp).unwrap() {
            // * when trade will make pool price converge to oracle price
            // * and end_rP won't reach the oracle price then use hmm all the way
            done_dx = Pool::dx_from_l_drp_hmm(liq, start_rp, end_rp, self.c, rp_oracle);
        } else {
            //we don't expect to hit this branch raise error if we do hit
            panic!("HMM adjstment: possibilities should have been exhausted by now");
        }

        // adjust to prevent rounding issues
        let adj_factor = Self::one().sub(Self::adj_whole_fill()).unwrap();
        done_dx = done_dx.mul(adj_factor);
        done_dx_cpmm = done_dx_cpmm.mul(adj_factor);

        hmm_adj_x = done_dx.sub(done_dx_cpmm).unwrap();

        if done_dx_cpmm.is_positive() {
            panic!("expect done_dX < 0 when Y supplied to pool");
            // again we allow 0-qty swap, just in case price was already
            // exactly on the tick we started with
        }
        if hmm_adj_x.is_negative() {
            panic!("hmm adj should be positive (conservative for pool ie giviing out less)");
        }
        if self.x.add(done_dx_cpmm).unwrap().is_negative() {
            panic!("cannot swap out more X than present in pool");
        }
        // avoid numerical noise due for very small trades relative to liquidity
        if !done_dx.is_zero() && done_dy.is_zero() {
            let avg_price = done_dy.add(fee_y).unwrap().div(done_dx);
            if avg_price.lt(start_rp.pow(2)).unwrap() {
                panic!("pool cannot sell X at a lower avg price than starting price");
            }
        }

        return SwapWithinResult::new(done_dy, done_dx, end_t, end_rp, cross, hmm_adj_x, fee_y);
    }

    pub fn execute_swap_from_y(&mut self, dy: Decimal, rp_oracle: Decimal) -> SwapOutput {
        // Swap algo when pool provided with dY > 0
        // We go from left to right on the price line (price goes up) and manage tick-crossings as needed.
        // within 2 consecutive active ticks, we delegate to swap_within_tick_from_Y(..)
        if !dy.is_positive() {
            panic!("can only handle Y being supplied to pool, dY>0");
        }
        let left_to_right = true;

        // get current tick, current root price, and liquidity in range
        let mut curr_t = self.glbl_tick();
        let mut curr_rp = self.glbl_rp();

        // main case: where liquidity_in_range > 0 --> call swap_within_tick_from_Y()
        // otherwise try to get some liquidity into range.
        // repeat till full order filled or pool liquidity dries up, comes whichever first
        let mut swpd_dx = Self::zero();
        let mut swpd_dy = Self::zero();
        let (mut adjusted_dx, mut total_fee_y) = (Self::zero(), Self::zero());
        let (avg_p, end_p);

        while swpd_dy.lt(dy).unwrap() {
            let goal_tick: Option<u128>;
            let (done_dx, done_dy, end_rp, hmm_adj_x, fee_y);
            let (end_t, cross);

            if self.glbl_liq().is_positive() {
                goal_tick = self.get_right_limit_of_swap_within(curr_t, self.glbl_tick());
            } else {
                // try move into range; if not possible then break out to end swap
                println!("Gap in liquidity... trying to get in range...");
                let rez = self.try_get_in_range(left_to_right);
                goal_tick = rez.goal_tick();
                curr_rp = rez.new_rp();
            }

            match goal_tick {
                None => {
                    // there are no more active ticks on the left, terminate swap
                    println!("no more active ticks (liquidity) in this direction");
                    avg_p = match swpd_dx.is_zero() {
                        false => swpd_dy.div(swpd_dx.neg()),
                        true => Self::zero(),
                    };
                    end_p = self.glbl_rp().pow(2);
                    println!(
                        "swpd_dX={:?} swpd_dY={:?} pool_X={:?} pool_Y={:?} avg_P={:?}, end_P={:?}",
                        swpd_dx, swpd_dy, self.x, self.y, avg_p, end_p
                    );
                    println!(
                            "adjusted_dX={:?}  pool_cumul_x_adj={:?} total_fee_y={:?}  pool_cumul_y_fee={:?}",
                            adjusted_dx, self.x_adj, total_fee_y, self.y_fee
                        );
                    return SwapOutput::new(
                        swpd_dy,
                        swpd_dx,
                        adjusted_dx,
                        total_fee_y,
                        avg_p,
                        end_p,
                    );
                }

                Some(gtk) => {
                    let rez = self.swap_within_tick_from_y(
                        curr_rp,
                        gtk,
                        self.glbl_liq(),
                        dy.sub(swpd_dy).unwrap(), // dy - swpd_dy
                        rp_oracle,
                    );
                    done_dx = rez.send_amount();
                    done_dy = rez.recv_amount();
                    end_t = rez.end_tick();
                    end_rp = rez.end_rp();
                    cross = rez.cross();
                    hmm_adj_x = rez.send_hmm_adj();
                    fee_y = rez.recv_fee();
                    let new_x = self.x.add(done_dx).unwrap().sub(hmm_adj_x).unwrap(); // self.x + done_dx - hmm_adj_x   >= 0.0
                    assert!(!new_x.is_negative(), "cannot swap out more Y than present");
                    let check = dy
                        .sub(swpd_dy)
                        .unwrap()
                        .sub(done_dy)
                        .unwrap()
                        .sub(fee_y)
                        .unwrap();
                    // dy - swpd_dy >= done_dy + fee_y
                    assert!(!check.is_negative(), "cannot fill more Y than provided");

                    // update local totals
                    // net total for output token: swpd_dx += done_dx
                    swpd_dx = swpd_dx.add(done_dx).unwrap();
                    // gross (including fees) for input token: swpd_dy += done_dy + fee_y
                    swpd_dy = swpd_dy.add(done_dy).unwrap().add(fee_y).unwrap();
                    adjusted_dx = adjusted_dx.add(hmm_adj_x).unwrap();
                    total_fee_y = total_fee_y.add(fee_y).unwrap();
                    curr_t = end_t;
                    curr_rp = end_rp;

                    // update global state to reflect price change (if any) & reserves
                    self.set_glbl_tick(curr_t);
                    self.set_glbl_rp(curr_rp);
                    self.x = new_x;
                    // hmm_adj comes out of reserves into fees 'vault'
                    self.y = self.y.add(done_dy).unwrap();
                    self.x_adj = self.x_adj.add(hmm_adj_x).unwrap();
                    self.y_fee = self.y_fee.add(fee_y).unwrap();

                    let liq_glbl = self.glbl_liq();
                    let (_, fg_y, hg_x, _) = self.glbl_fees();
                    if liq_glbl.is_positive() {
                        // make sure not 0 liquidity (empty trade)
                        // * update fee growth to reflect latest swap_within
                        self.set_fee_glbl('x', 'h', hmm_adj_x.div(liq_glbl).add(hg_x).unwrap()); // hg_x + hmm_adj_x / liq_glbl

                        self.set_fee_glbl('y', 'f', fee_y.div(liq_glbl).add(fg_y).unwrap());
                        // fg_y + fee_y / liq_glbl
                    }

                    // perform crossing of tick, if necessary
                    if cross == true {
                        assert!(end_t == gtk);
                        if self.active_ticks.contains_key(&gtk) {
                            self.cross_tick(gtk, left_to_right)
                        }
                    }
                }
            }
        }

        avg_p = match swpd_dx.is_zero() {
            false => swpd_dy.div(swpd_dx.neg()),
            true => Self::zero(),
        };
        end_p = self.glbl_rp().pow(2);
        println!(
            "swpd_dX={:?} swpd_dY={:?} pool_X={:?} pool_Y={:?} avg_P={:?}, end_P={:?}",
            swpd_dx, swpd_dy, self.x, self.y, avg_p, end_p
        );
        println!(
            "adjusted_dX={:?}  pool_cumul_x_adj={:?} total_fee_y={:?}  pool_cumul_y_fee={:?}",
            adjusted_dx, self.x_adj, total_fee_y, self.y_fee
        );

        return SwapOutput::new(swpd_dy, swpd_dx, adjusted_dx, total_fee_y, avg_p, end_p);
    }
}
