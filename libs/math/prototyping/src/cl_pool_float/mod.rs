#![allow(dead_code)]
pub mod cl_math;

pub use cl_math::PoolMath;
use std::collections::{BTreeMap, HashMap};

// #[allow(dead_code)] // for indiv struct
#[derive(Debug)]
pub struct PoolToken<'a> {
    name: &'a str,
    decimals: u8,
}

impl<'a> PoolToken<'a> {
    pub fn new(name: &'a str, decimals: u8) -> Self {
        Self { name, decimals }
    }
}

#[derive(Debug)]
pub struct GlobalState {
    /// contract global state
    liq: f64, // liquidity
    rp: f64,   // sqrt price
    tick: u32, // current tick
    fg_x: f64, // fee growth global
    fg_y: f64, // fee growth global
    hg_x: f64, // fee growth global
    hg_y: f64, // fee growth global
}

impl GlobalState {
    pub fn new(liq: f64, rp: f64, tick: u32, fg_x: f64, fg_y: f64, hg_x: f64, hg_y: f64) -> Self {
        Self {
            liq,
            rp,
            tick,
            fg_x,
            fg_y,
            hg_x,
            hg_y,
        }
    }
}

#[derive(Debug, Clone)]
pub struct TickState {
    ///Tick Indexed State
    liq_net: f64, // LiquidityNet
    liq_gross: f64, // LiquidityGross
    f0_x: f64,      // feegrowth outside
    f0_y: f64,      // feegrowth outside
    h0_x: f64,      // hmm adj-fee growth outside
    h0_y: f64,      // hmm adj-fee growth outside
}

impl TickState {
    pub fn new(liq_net: f64, liq_gross: f64, f0_x: f64, f0_y: f64, h0_x: f64, h0_y: f64) -> Self {
        TickState {
            liq_net,
            liq_gross,
            f0_x,
            f0_y,
            h0_x,
            h0_y,
        }
    }
}
#[derive(Debug)]
pub struct PositionState {
    ///Position Indexed State
    liq: f64, // liquidity
    fr_x: f64, // feegrowth inside last
    fr_y: f64, // feegrowth inside last
    hr_x: f64, // hmm adj-fee growth inside last
    hr_y: f64, // hmm adj-fee growth inside last
}

impl PositionState {
    pub fn new(liq: f64, fr_x: f64, fr_y: f64, hr_x: f64, hr_y: f64) -> Self {
        Self {
            liq,
            fr_x,
            fr_y,
            hr_x,
            hr_y,
        }
    }
}

#[derive(Debug, PartialEq, Eq, Hash)]
pub struct PositionKey(String, u32, u32);

#[derive(Debug)]
pub struct Pool<'a> {
    token_x: PoolToken<'a>,
    token_y: PoolToken<'a>,
    tick_spacing: u32,
    global_state: GlobalState,
    active_ticks: BTreeMap<u32, TickState>, // keep ordered
    positions: HashMap<PositionKey, PositionState>,
    x: f64,
    y: f64,
    x_adj: f64,
    y_adj: f64,
    x_fee: f64,
    y_fee: f64,
    c: f64,
    fee_rate: f64,
}

impl PoolMath for Pool<'_> {}

impl<'a> Pool<'a> {
    pub fn new(
        x_name: &'a str,
        x_decimals: u8,
        y_name: &'a str,
        y_decimals: u8,
        bootstrap_rp: f64,
        tick_spacing: u32,
        hmm_c: f64,
        fee_rate: f64,
    ) -> Pool<'a> {
        let tk = Self::rp_to_possible_tk(bootstrap_rp, tick_spacing, false);
        let rp = Self::tick_to_rp(tk);

        Pool {
            token_x: PoolToken::new(x_name, x_decimals),
            token_y: PoolToken::new(y_name, y_decimals),
            tick_spacing,
            global_state: GlobalState::new(0.0, rp, tk, 0.0, 0.0, 0.0, 0.0),
            active_ticks: BTreeMap::new(),
            positions: HashMap::new(),
            x: 0.0,
            y: 0.0,
            x_adj: 0.0,
            y_adj: 0.0,
            x_fee: 0.0,
            y_fee: 0.0,
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
    pub fn x_info(&self) -> (f64, f64, f64) {
        (self.x, self.x_adj, self.x_fee)
    }
    pub fn y_info(&self) -> (f64, f64, f64) {
        (self.y, self.y_adj, self.y_fee)
    }
    pub fn glbl_liq(&self) -> f64 {
        self.global_state.liq
    }
    pub fn glbl_tick(&self) -> u32 {
        self.global_state.tick
    }
    pub fn glbl_rp(&self) -> f64 {
        self.global_state.rp
    }
    pub fn fg_x(&self) -> f64 {
        self.global_state.fg_x
    }
    pub fn fg_y(&self) -> f64 {
        self.global_state.fg_y
    }
    pub fn hg_x(&self) -> f64 {
        self.global_state.hg_x
    }
    pub fn hg_y(&self) -> f64 {
        self.global_state.hg_y
    }

    fn tick_to_possible_tick(&self, tick: u32, left_to_right: bool) -> u32 {
        // use tick_spacing to find allowable/ initializable tick that is <= tick
        // (if left_to_right is false) or >= tick (if left_to_right is true)
        // returns unchanged tick if self.tick_spacing is 1
        Self::tk_to_possible_tk(tick, self.tick_spacing, left_to_right)
    }

    fn rp_to_possible_tick(&self, rp: f64, left_to_right: bool) -> u32 {
        // find allowable tick from given rp
        Self::rp_to_possible_tk(rp, self.tick_spacing, left_to_right)
    }

    fn initialize_tick(&mut self, tick: u32) {
        // set f0 of tick based on convention [6.21]
        let (f0_x, f0_y, h0_x, h0_y) = if self.glbl_tick() >= tick {
            (self.fg_x(), self.fg_y(), self.hg_x(), self.hg_y())
        } else {
            (0.0, 0.0, 0.0, 0.0)
        };

        let ts = TickState::new(0.0, 0.0, f0_x, f0_y, h0_x, h0_y);
        self.active_ticks.insert(tick, ts);
    }

    fn unset_tick(&mut self, tick: u32) {
        self.active_ticks.remove(&tick);
    }

    fn update_tick(&mut self, tick: u32, liq_delta: f64, upper: bool) {
        // Update specific tick's liquidity delta for specific tick
        // get the tick state for tick if exists, else initialize one
        if self.active_ticks.get(&tick).is_none() {
            self.initialize_tick(tick);
        }
        let ts = self.active_ticks.get_mut(&tick).unwrap();

        ts.liq_net += if !upper { liq_delta } else { -liq_delta };
        ts.liq_gross += liq_delta;

        if ts.liq_gross == 0.0 {
            // de-initialize tick when no longer ref'ed by a position
            self.unset_tick(tick);
        }
    }

    fn cross_tick(&mut self, provided_tick: u32, left_to_right: bool) {
        // Handle update of global state and tick state when initialized tick is crossed
        // while performing swap
        if !left_to_right && self.glbl_tick() != provided_tick {
            panic!("can only cross current tick");
        }
        let ts = self
            .active_ticks
            .get_mut(&provided_tick)
            .expect("cannot find tick for crossing");

        // add/substract to glabal liq depending on direction of crossing
        let liq_to_apply = if left_to_right {
            ts.liq_net
        } else {
            -ts.liq_net
        };
        if self.global_state.liq + liq_to_apply < 0.0 {
            panic!("liquidity cannot turn negative");
        }
        self.global_state.liq += liq_to_apply;

        // update tick state by flipping fee growth outside f0_X_Y [6.26]
        ts.f0_x = self.global_state.fg_x - ts.f0_x;
        ts.f0_y = self.global_state.fg_y - ts.f0_y;
        ts.h0_x = self.global_state.hg_x - ts.h0_x;
        ts.h0_y = self.global_state.hg_y - ts.h0_y;
        // TODO: do the same for s0, i0, sl0 in Tick-state

        // update current tick in global state to reflect crossing; rP unchanged
        if left_to_right {
            self.global_state.tick = provided_tick;
        } else {
            self.global_state.tick = self.tick_to_possible_tick(provided_tick - 1, left_to_right)
        }
    }

    fn get_left_limit_of_swap_within(&self, start_t: u32) -> Option<u32> {
        // get next available active tick from a starting point going left
        let tick = self.tick_to_possible_tick(start_t.min(self.glbl_tick()), false);
        for &tk in self.active_ticks.keys().rev() {
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

    fn get_right_limit_of_swap_within(&self, start_t: u32, glbl_tick: u32) -> Option<u32> {
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
            for &tk in self.active_ticks.keys() {
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
            for &tk in self.active_ticks.keys() {
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

    pub fn tick_keys_cloned(&self, reverse: bool) -> Vec<u32> {
        match reverse {
            // true => Vec::from_iter(self.active_ticks.keys().rev().map(|&x| x)),
            // false => Vec::from_iter(self.active_ticks.keys().map(|&x| x)),
            true => self.active_ticks.keys().rev().cloned().collect(),
            false => self.active_ticks.keys().cloned().collect(),
        }
    }

    fn try_get_in_range(&mut self, left_to_right: bool) -> (Option<u32>, u32, f64) {
        // During swap, when no liquidity in current state, find next active tick, cross it  to
        // kick-in some liquidity. return (new_goal_tick or None, glbl_tick and glbl_rP).
        if self.global_state.liq > 0.0 {
            panic!("there already is liquidity in range");
        }

        if !left_to_right {
            // going right to left, X in Y out
            for tk in self.tick_keys_cloned(true) {
                // descending
                if tk > self.global_state.tick {
                    continue; // ignore ticks above current tick
                }
                self.global_state.tick = tk;
                self.global_state.rp = Self::tick_to_rp(tk);
                self.cross_tick(tk, left_to_right);
                // crossing shud put glbl_state.tick 1 (possible) tick under tk
                // set the next goal for swap
                let new_goal = self.get_left_limit_of_swap_within(self.global_state.tick);
                // at this point some Liquidity should have kicked in
                if self.global_state.liq < 0.0 {
                    panic!(
                        "from being out of range, we don't expect to kick in negative liquidity"
                    );
                }
                if self.global_state.liq > 0.0 {
                    // * return next goal (1 tick under tk) and tk just crossed
                    return (new_goal, tk, self.global_state.rp);
                }
            }
        } else {
            for tk in self.tick_keys_cloned(false) {
                // ascending
                if tk <= self.global_state.tick {
                    continue; // ignore ticks above current tick
                }
                self.global_state.tick = tk;
                self.global_state.rp = Self::tick_to_rp(tk);
                self.cross_tick(tk, left_to_right);
                // at this point some Liquidity should have kicked in
                // now find the new goal_tick to be passed to swap_within()
                let new_goal = self.get_right_limit_of_swap_within(tk, tk);

                if self.global_state.liq < 0.0 {
                    panic!("from being out of rng, we don't expect to kick in negative liquidity");
                }
                if self.global_state.liq > 0.0 {
                    // * return next goal and tk just crossed (==global_st tick)
                    return (new_goal, tk, self.global_state.rp);
                }
            }
        }
        return (None, self.glbl_tick(), self.glbl_rp());
    }

    //+ DEPOSITS AND WITHDRAWALS
    fn fee_below_above(&self, tick: u32, for_x: bool, swp: bool) -> (f64, f64) {
        // Fees earned in a token below and above tick, as tuple.
        // can compute for either token: X if 'for_x' is true, else Y
        // & for either swap fees or hmm fees: swap fees id 'swp' is true else hmm fees)

        let i_c = self.glbl_tick();
        let fg = match swp {
            true => {
                if for_x {
                    self.fg_x()
                } else {
                    self.fg_y()
                }
            }
            false => {
                if for_x {
                    self.fg_x()
                } else {
                    self.fg_y()
                }
            }
        };
        let ts = self.active_ticks.get(&tick);

        match ts {
            None => (fg, 0.0), // from [6.17 - 6.21], convention
            Some(ts) => {
                let f0 = match swp {
                    true => {
                        if for_x {
                            ts.f0_x
                        } else {
                            ts.f0_y
                        }
                    }
                    false => {
                        if for_x {
                            ts.h0_x
                        } else {
                            ts.h0_y
                        }
                    }
                };
                let f_below = if i_c >= tick { f0 } else { fg - f0 }; // [6.18]
                let f_above = if i_c >= tick { fg - f0 } else { f0 }; // [6.17]
                (f_below, f_above)
            }
        }
    }

    fn fee_rng(&self, lower_tick: u32, upper_tick: u32, for_x: bool, swp: bool) -> f64 {
        // Fees earned (per unit of liq) within a range of ticks (e.g. by a position)
        let (f_blw_lwr, f_abv_lwr) = self.fee_below_above(lower_tick, for_x, swp);
        let (f_blw_upr, f_abv_upr) = self.fee_below_above(upper_tick, for_x, swp);

        // retrieve fg by summing up either tuple, they should match
        assert_eq!(f_blw_lwr + f_abv_lwr, f_blw_upr + f_abv_upr);
        let fg = f_blw_lwr + f_abv_lwr;

        fg - f_blw_lwr - f_abv_upr
    }

    fn _set_position(
        &mut self,
        user_id: &str,
        lower_tick: u32,
        upper_tick: u32,
        liq_delta: f64,
    ) -> (f64, f64, f64, f64) {
        // handles all facets for updates a position for in the pool,
        // used for deposits (l>0), withdrawals (l<0)
        // compute uncollected fees f_u the poz is entitled to: first compute new FeeGrowthInside,
        // to be written to position will be set to 0 by function if tick not initialized
        let new_fr_x = self.fee_rng(lower_tick, upper_tick, true, true);
        let new_fr_y = self.fee_rng(lower_tick, upper_tick, false, true);
        let new_hr_x = self.fee_rng(lower_tick, upper_tick, true, false);
        let new_hr_y = self.fee_rng(lower_tick, upper_tick, false, false);

        // then get old value from when position was last touched.(set below)
        // set to 0 as default for when new position
        let (mut old_fr_x, mut old_fr_y) = (0.0, 0.0);
        let (mut old_hr_x, mut old_hr_y) = (0.0, 0.0);
        // liquidity to use for computing fee amounts (set below)
        let mut base = 0.0;

        // find position if exists
        // positions are uniquely identitfied by the (sender, lower, upper)
        let key = PositionKey(user_id.to_string(), lower_tick, upper_tick);

        match self.positions.get_mut(&key) {
            None => {
                if liq_delta < 0.0 {
                    // abort if withdrawal liq exceeds position liquidity
                    panic!("cannot newly provide negative liquidity");
                }
                self.positions
                    .insert(key, PositionState::new(liq_delta, 0.0, 0.0, 0.0, 0.0));
            }
            Some(poz) => {
                // get old value for feed from when position was last touched
                old_fr_x = poz.fr_x;
                old_fr_y = poz.fr_y;
                old_hr_x = poz.hr_x;
                old_hr_y = poz.hr_y;
                base = poz.liq;

                // update existing position
                if liq_delta < 0.0 && poz.liq + liq_delta < 0.0 {
                    // abort if withdrawal liq exceeds position liquidity
                    panic!("liquidity is position insufficient");
                }
                if poz.liq + liq_delta == 0.0 {
                    // if position liq becomes 0 after operation remove from pool
                    self.positions.remove(&key);
                } else {
                    poz.liq += liq_delta;
                    poz.fr_x = new_fr_x;
                    poz.fr_y = new_fr_y;
                    poz.hr_x = new_hr_x;
                    poz.hr_y = new_hr_y;
                }
            }
        }
        // now calulate uncollected fees to be applied
        let (f_u_x, f_u_y) = (new_fr_x - old_fr_x, new_fr_y - old_fr_y);
        let (h_u_x, h_u_y) = (new_hr_x - old_hr_x, new_hr_y - old_hr_y);
        assert!(f_u_x >= 0.0 && f_u_y >= 0.0 && h_u_x >= 0.0 && h_u_y >= 0.0);

        // update tick states for lower and upper
        self.update_tick(lower_tick, liq_delta, false);
        self.update_tick(upper_tick, liq_delta, true);

        // update global state's liquidity if current price in poz's range
        if self.global_state.tick >= lower_tick && self.global_state.tick < upper_tick {
            self.global_state.liq += liq_delta;
        }
        // return uncollected fee amounts to offset/add in deposit/withdrawal
        (base * f_u_x, base * f_u_y, base * h_u_x, base * h_u_y)
    }

    pub fn deposit(&mut self, user_id: &str, x: f64, y: f64, rpa: f64, rpb: f64) {
        // interface to deposit liquidity in pool & give change if necessary
        if x < 0.0 || y < 0.0 {
            panic!("can only deposit positive amounts");
        }

        // calculate ticks that will be used to track position
        let lower_tick = self.rp_to_possible_tick(rpa, false);
        let upper_tick = self.rp_to_possible_tick(rpb, false);
        let tk = self.glbl_tick();

        // TODO should we use Oracle price here instead? or real price as param
        // ? only when no liquidity in range?

        let mut liq = Pool::liq_from_x_y_tick_rng(x, y, tk, lower_tick, upper_tick);
        // round down to avoid float rounding vulnerabilities
        // TODO choose what precision to round down to
        if Self::FLOOR_LIQ {
            liq = liq.floor()
        };

        let x_in = Pool::x_from_l_tick_rng(liq, tk, lower_tick, upper_tick).min(x);
        let y_in = Pool::y_from_l_tick_rng(liq, tk, lower_tick, upper_tick).min(y);
        if x_in > x {
            panic!("used x amt cannot exceed provided amount");
        }
        if y_in > y {
            panic!("used y amt cannot exceed provided amount");
        }

        let (fees_x, fees_y, adj_x, adj_y) =
            self._set_position(user_id, lower_tick, upper_tick, liq);

        // offset fee amounts from deposit amounts: this will be the amount debited from user
        let x_debited = x_in - fees_x - adj_x;
        let y_debited = y_in - fees_y - adj_y;
        // update state: reserves, fee pot , hmm-adj-fee pot
        self.x += x_in;
        self.y += y_in;
        self.x_fee -= fees_x;
        self.x_adj -= adj_x;
        self.y_fee -= fees_y;
        self.y_adj -= adj_y;

        println!("x_debited={} y_debited {}", x_debited, y_debited);
        println!(
            "including fees_x+adj_x ={} and fees_y+adj_y={}",
            fees_x + adj_x,
            fees_y + adj_y
        );
        println!("X returned {} Y returned {}", x - x_debited, y - y_debited);
    }

    pub fn withdraw(&mut self, user_id: &str, liq: f64, rpa: f64, rpb: f64) {
        // interface to withdraw liquidity from pool
        if liq < 0.0 {
            panic!("")
        }

        // calculate ticks that will be used to track position
        let lower_tick = self.rp_to_possible_tick(rpa, false);
        let upper_tick = self.rp_to_possible_tick(rpb, false);

        let (fees_x, fees_y, adj_x, adj_y) =
            self._set_position(user_id, lower_tick, upper_tick, -liq);
        let tk = self.glbl_tick();

        // TODO should we use Oracle price here instead? or real price as param
        // ? only when no liquidity in range?

        let mut x_out = Pool::x_from_l_tick_rng(liq, tk, lower_tick, upper_tick);
        let mut y_out = Pool::y_from_l_tick_rng(liq, tk, lower_tick, upper_tick);
        // round down amount withdrawn if necessary, as precation
        x_out *= 1.0 - Pool::ADJ_WITHDRAWAL;
        y_out *= 1.0 - Pool::ADJ_WITHDRAWAL;

        // add fees on to what user will receive
        let x_sent = x_out + fees_x + adj_x;
        let y_sent = y_out + fees_y + adj_y;

        // update state: reserves, fee pot , hmm-adj-fee pot
        self.x -= x_out;
        self.y -= y_out;
        self.x_fee -= fees_x;
        self.x_adj -= adj_x;
        self.y_fee -= fees_y;
        self.y_adj -= adj_y;

        println!("x_sent: {}, y_sent: {}", x_sent, y_sent);
        println!("including {} & {}", fees_x + adj_x, fees_y + adj_y);
    }

    //+ SWAPPING
    fn swap_within_tick_from_x(
        &mut self,
        start_rp: f64,
        goal_tick: u32,
        liq: f64,
        dx: f64,
        rp_oracle: f64,
    ) -> (f64, f64, u32, f64, bool, f64, f64) {
        // + no writing to state to occurs here, just calc and return to caller
        let (done_dx, end_t, end_rp, cross, hmm_adj_y, fee_x);
        let mut done_dy;

        if dx <= 0.0 {
            panic!("can only handle X being supplied to pool, dX>0");
        }

        // root-price at goal tick - here on the left
        let rp_goal = Pool::tick_to_rp(goal_tick);
        if rp_goal > start_rp {
            panic!("expect price to go down when X supplied to pool");
            // we allow case when price exactly on the current tick ( i.e. rP_goal = start_rP)
            // this will lead to 0-qty swapped, and crossing before next swap
        }

        // put aside max potential swap fees before affecting prices
        let dx_max = dx * (1.0 - self.fee_rate);

        // chg of reserve X possible if we go all the way to goal tick
        let doable_dx = Pool::dx_from_l_drp(liq, start_rp, rp_goal);
        if doable_dx < 0.0 {
            // expect a positive number
            panic!("doable_dX > 0 when X supplied to pool");
        }

        if doable_dx < dx_max {
            // we'll have leftover to swap. do what we can. done_X = doableX
            done_dx = doable_dx;
            // reverse engineer how much fees charged based on how much done_dX
            fee_x = done_dx / (1.0 - self.fee_rate) * self.fee_rate;
            cross = true; // because we'll need to cross and do extra swaps
            end_t = goal_tick; // swap so far moves price to level at this tick
            end_rp = rp_goal; // ensure use same rP at tick borders, avoid log
        } else {
            // we have enough. make all dX_max 'done', then calc end_rP
            done_dx = dx_max;
            fee_x = dx - dx_max; // fee as expected
            cross = false;
            end_rp = Pool::rp_new_from_l_dx(liq, start_rp, done_dx);
            end_t = Pool::rp_to_tick(end_rp, false);
            // * this log is take only once per trade if end between ticks
            // * tick is always on the left (round down after log)

            if end_rp > start_rp {
                panic!("expect end_rP < start_rP when pool given X");
            }
            if end_rp < rp_goal {
                panic!("dont expect end_rP go beyond rP_goal (left) when able to wholy fill dX")
            }
        }
        // now figure out how much done_dY and hmm_adj_Y
        let mut done_dy_amm = Pool::dy_from_l_drp(liq, start_rp, end_rp);
        if self.c == 0.0 || rp_oracle >= start_rp {
            // also when rP_oracle is None
            // in cases where no oracle or no hmm c=0, we cannot adjust so we fall back to amm
            // * when trade will make pool price diverge more from oracle,
            // * then we don't adjust (hmm adjust on convergence only)
            done_dy = done_dy_amm;
        } else if rp_oracle < start_rp && rp_oracle >= end_rp {
            // 1st condition is redundant as implied from precious branch
            // we are leaving it for precision and readability
            // * when oracle is in between start_rP and end_rP prices, use hmm
            // * till we get to oracle then use unadjusted amm till end_rP
            done_dy = Pool::dy_from_l_drp_hmm(liq, start_rp, rp_oracle, self.c, rp_oracle);
            done_dy += Pool::dy_from_l_drp(liq, rp_oracle, end_rp);
        } else if rp_oracle < end_rp {
            // * when trade will make pool price converge to oracle price
            // * and end_rP won't reach the oracle price
            // * then use hmm all the way
            done_dy = Pool::dy_from_l_drp_hmm(liq, start_rp, end_rp, self.c, rp_oracle);
        } else {
            // we don't expect to hit this. raise error if we do hit
            panic!("HMM adjstment: possibilities should be exhausted by now");
        }

        // adjust conservatively to avoid rounding issues.
        done_dy *= 1.0 - Pool::ADJ_WHOLE_FILL;
        done_dy_amm *= 1.0 - Pool::ADJ_WHOLE_FILL;

        hmm_adj_y = done_dy - done_dy_amm;

        if done_dy_amm > 0.0 {
            panic!("expect done_dY < 0 when X supplied to pool")
            // again we allow 0-qty swap, just in case price was already
            // exactly on the tick we started with
        }
        if hmm_adj_y < 0.0 {
            panic!("hmm adj should be positive (conservative 4 pool)");
        }
        if self.y + done_dy_amm < 0.0 {
            panic!("cannot swap out more Y than present in pool");
        }
        return (done_dx, done_dy, end_t, end_rp, cross, hmm_adj_y, fee_x);
    }

    pub fn execute_swap_from_x(
        &mut self,
        dx: f64,
        rp_oracle: f64,
    ) -> (f64, f64, f64, f64, f64, f64) {
        // * Swap algo when provided with dX>0
        // * We go from right to left on the curve and manage crossings as needed.
        // * within initialized tick we use swap_within_tick_from_X
        if dx <= 0.0 {
            panic!("can only handle X being supplied to pool, dX>0");
        }
        let left_to_right = false;

        // get current tick, current root price, and liquidity in range
        let mut curr_t = self.glbl_tick();
        let mut curr_rp = self.glbl_rp();

        // main case where liq_in range > 0 , call swap_within_tick_from_X
        // otherwise try to get in range.
        // repeat till full order filled or liquidity dries up, whichever first
        let (mut swpd_dx, mut swpd_dy) = (0.0, 0.0);
        let (mut adjusted_dy, mut total_fee_x) = (0.0, 0.0);
        let (avg_p, end_p);

        while swpd_dx < dx {
            let goal_tick: Option<u32>;
            let (done_dx, done_dy, end_rp, hmm_adj_y, fee_x);
            let (end_t, cross);

            if self.glbl_liq() > 0.0 {
                goal_tick = self.get_left_limit_of_swap_within(curr_t);
            } else {
                // try move into range, if cannot then break out to end swap
                println!("Gap in liquidity... trying to get in range...");
                let rez = self.try_get_in_range(left_to_right);
                goal_tick = rez.0;
                curr_t = rez.1;
                curr_rp = rez.2;
            }

            match goal_tick {
                None => {
                    // there are no more active ticks on the left, terminate swap
                    println!("no more active ticks (liquidity) in this direction");
                    avg_p = if swpd_dx != 0.0 {
                        -swpd_dy / swpd_dx
                    } else {
                        0.0
                    };
                    end_p = self.glbl_rp().powi(2);
                    println!(
                        "swpd_dX={} swpd_dY={} pool_X={} pool_Y={} avg_P={}, end_P={}",
                        swpd_dx, swpd_dy, self.x, self.y, avg_p, end_p
                    );
                    println!(
                        "adjusted_dY={}  pool_cumul_Y_adj={} total_fee_X={}  pool_cumul_X_fee={}",
                        adjusted_dy, self.y_adj, total_fee_x, self.x_fee
                    );
                    return (swpd_dx, swpd_dy, adjusted_dy, total_fee_x, avg_p, end_p);
                }

                Some(gtk) => {
                    let rez = self.swap_within_tick_from_x(
                        curr_rp,
                        gtk,
                        self.glbl_liq(),
                        dx - swpd_dx,
                        rp_oracle,
                    );
                    done_dx = rez.0;
                    done_dy = rez.1;
                    end_t = rez.2;
                    end_rp = rez.3;
                    cross = rez.4;
                    hmm_adj_y = rez.5;
                    fee_x = rez.6;
                    assert!(self.y + done_dy - hmm_adj_y >= 0.0);
                    assert!(dx - swpd_dx >= done_dx + fee_x);

                    // update local totals
                    swpd_dx += done_dx + fee_x; // gross for input token
                    swpd_dy += done_dy; // net for output token
                    adjusted_dy += hmm_adj_y;
                    total_fee_x += fee_x;
                    curr_t = end_t;
                    curr_rp = end_rp;

                    // update global state to reflect price change (if any) & reserves
                    self.global_state.tick = curr_t;
                    self.global_state.rp = curr_rp;
                    self.x += done_dx;
                    self.y += done_dy - hmm_adj_y; // adj out of reserves into fees
                    self.x_fee += fee_x;
                    self.y_adj += hmm_adj_y;
                    if self.glbl_liq() > 0.0 {
                        // make sure not 0 liquidity (empty trade)
                        // * update fee growth to reflect latest swap_within
                        self.global_state.fg_x += fee_x / self.glbl_liq();
                        self.global_state.hg_y += hmm_adj_y / self.glbl_liq();
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
        avg_p = if swpd_dx != 0.0 {
            -swpd_dy / swpd_dx
        } else {
            0.0
        };
        end_p = self.glbl_rp().powi(2);
        println!(
            "swpd_dX={} swpd_dY={} pool_X={} pool_Y={} avg_P={}, end_P={}",
            swpd_dx, swpd_dy, self.x, self.y, avg_p, end_p
        );
        println!(
            "adjusted_dY={}  pool_cumul_Y_adj={} total_fee_X={}  pool_cumul_X_fee={}",
            adjusted_dy, self.y_adj, total_fee_x, self.x_fee
        );

        return (swpd_dx, swpd_dy, adjusted_dy, total_fee_x, avg_p, end_p);
    }

    fn swap_within_tick_from_y(
        &mut self,
        start_rp: f64,
        goal_tick: u32,
        liq: f64,
        dy: f64,
        rp_oracle: f64,
    ) -> (f64, f64, u32, f64, bool, f64, f64) {
        // + no writing to state to occurs here, just calc and return to caller
        let (done_dy, end_t, end_rp, cross, hmm_adj_x, fee_y);
        let mut done_dx;

        if dy <= 0.0 {
            panic!("can only handle Y being supplied to pool, dY>0");
        }

        // root-price at goal tick - here on the right
        let rp_goal = Pool::tick_to_rp(goal_tick);
        if rp_goal < start_rp {
            panic!("expect price to go up when Y supplied to pool");
            // we allow case when price exactly on the current tick ( i.e. rP_goal = start_rP)
            // this will lead to 0-qty swapped, and crossing before next swap
        }

        // put aside max potential swap fees before affecting prices
        let dy_max = dy * (1.0 - self.fee_rate);

        // chg of reserve Y possible if we go all the way to goal tick
        let doable_dy = Pool::dy_from_l_drp(liq, start_rp, rp_goal);
        if doable_dy < 0.0 {
            // expect a positive number
            panic!("doable_dY >= 0 when Y supplied to pool");
        }

        if doable_dy < dy_max {
            // we'll have leftover to swap. do what we can. done_Y = doableY
            done_dy = doable_dy;
            // reverse engineer how much fees charged based on how much done_dY
            fee_y = done_dy / (1.0 - self.fee_rate) * self.fee_rate;
            cross = true; // because we'll need to cross and do extra swaps
            end_t = goal_tick; // swap so far moves price to level at this tick
            end_rp = rp_goal; // ensure use same rP at tick borders, avoid log
        } else {
            // we have enough, make all of dY_max 'done', then calc end_rP
            done_dy = dy_max;
            fee_y = dy - dy_max; // fee as expected
            cross = false;
            end_rp = Pool::rp_new_from_l_dy(liq, start_rp, done_dy);
            end_t = Pool::rp_to_tick(end_rp, false);
            // * this log is take only once per trade if end between ticks
            // * tick is always on the left (round down after log)

            if end_rp < start_rp {
                panic!("expect end_rP > start_rP when pool given Y");
            }
            if end_rp > rp_goal {
                panic!("dont expect end_rP go beyond rP_goal (right) when able to wholy fill dY");
            }
        }
        // now figure out how much done_dX and hmm_adj_X
        let mut done_dx_amm = Pool::dx_from_l_drp(liq, start_rp, end_rp);

        if self.c == 0.0 || rp_oracle <= start_rp {
            // also also rP_oracle is None
            // in cases where no oracle or no hmm as c=0, we cannot adjust so we fall back to amm
            // * when trade will make pool price diverge more from oracle,
            // * then we don't adjust (hmm adjust on convergence only)
            done_dx = done_dx_amm;
        } else if rp_oracle > start_rp && rp_oracle <= end_rp {
            // 1st term is redundant as implied from precious branch
            // we are adding for precision and readability
            // * when oracle is in between start_rP and end_rP prices, use hmm
            // * till we get to oracle then use unadjusted amm till end_rP
            done_dx = Pool::dx_from_l_drp_hmm(liq, start_rp, rp_oracle, self.c, rp_oracle);
            done_dx += Pool::dx_from_l_drp(liq, rp_oracle, end_rp);
        } else if rp_oracle > end_rp {
            // * when trade will make pool price converge to oracle price
            // * and end_rP won't reach the oracle price then use hmm all the way
            done_dx = Pool::dx_from_l_drp_hmm(liq, start_rp, end_rp, self.c, rp_oracle);
        } else {
            //we don't expect to hit this branch raise error if we do hit
            panic!("HMM adjstment: possibilities should be exhausted by now");
        }

        // adjust to prevent rounding issues
        done_dx_amm *= 1.0 - Pool::ADJ_WHOLE_FILL;
        done_dx *= 1.0 - Pool::ADJ_WHOLE_FILL;

        hmm_adj_x = done_dx - done_dx_amm;

        if done_dx_amm > 0.0 {
            panic!("expect done_dX < 0 when Y supplied to pool");
            // again we allow 0-qty swap, just in case price was already
            // exactly on the tick we started with
        }
        if hmm_adj_x < 0.0 {
            panic!("hmm adj should be positive (conservative 4 pool)");
        }
        if self.x + done_dx_amm < 0.0 {
            panic!("cannot swap out more X than present in pool");
        }

        return (done_dx, done_dy, end_t, end_rp, cross, hmm_adj_x, fee_y);
    }

    pub fn execute_swap_from_y(
        &mut self,
        dy: f64,
        rp_oracle: f64,
    ) -> (f64, f64, f64, f64, f64, f64) {
        // Swap algo when pool provided with dY > 0
        // We go from right to left on the curve and manage crossings as needed.
        // within initialized tick we use swap_within_tick_from_X
        if dy <= 0.0 {
            panic!("can only handle Y being supplied to pool, dY>0");
        }
        let left_to_right = true;

        // get current tick, current root price, and liquidity in range
        let mut curr_t = self.glbl_tick();
        let mut curr_rp = self.glbl_rp();

        // main case where liq_in range > 0 , call swap_within_tick_from_Y
        // otherwise try to get in range.
        // repeat till full order filled or liquidity dries up, whichever first
        let (mut swpd_dx, mut swpd_dy) = (0.0, 0.0);
        let (mut adjusted_dx, mut total_fee_y) = (0.0, 0.0);
        let (avg_p, end_p);

        while swpd_dy < dy {
            let goal_tick: Option<u32>;
            let (done_dx, done_dy, end_rp, hmm_adj_x, fee_y);
            let (end_t, cross);

            if self.glbl_liq() > 0.0 {
                goal_tick = self.get_right_limit_of_swap_within(curr_t, self.glbl_tick());
            } else {
                // try move into range, if cannot then break out to end swap
                println!("Gap in liquidity... trying to get in range...");
                let rez = self.try_get_in_range(left_to_right);
                goal_tick = rez.0;
                curr_t = rez.1;
                curr_rp = rez.2;
            }

            match goal_tick {
                None => {
                    // there are no more active ticks on the left, terminate swap
                    println!("no more active ticks (liquidity) in this direction");
                    avg_p = if swpd_dx != 0.0 {
                        -swpd_dy / swpd_dx
                    } else {
                        0.0
                    };
                    end_p = self.glbl_rp().powi(2);
                    println!(
                        "swpd_dX={} swpd_dY={} pool_X={} pool_Y={} avg_P={}, end_P={}",
                        swpd_dx, swpd_dy, self.x, self.y, avg_p, end_p
                    );
                    println!(
                        "adjusted_dX={}  pool_cumul_x_adj={} total_fee_y={}  pool_cumul_y_fee={}",
                        adjusted_dx, self.x_adj, total_fee_y, self.y_fee
                    );
                    return (swpd_dx, swpd_dy, adjusted_dx, total_fee_y, avg_p, end_p);
                }

                Some(gtk) => {
                    let rez = self.swap_within_tick_from_y(
                        curr_rp,
                        gtk,
                        self.glbl_liq(),
                        dy - swpd_dy,
                        rp_oracle,
                    );
                    done_dx = rez.0;
                    done_dy = rez.1;
                    end_t = rez.2;
                    end_rp = rez.3;
                    cross = rez.4;
                    hmm_adj_x = rez.5;
                    fee_y = rez.6;
                    assert!(self.x + done_dx - hmm_adj_x >= 0.0);
                    assert!(dy - swpd_dy >= done_dy + fee_y);

                    // update local totals
                    swpd_dx += done_dx; // net for output token
                    swpd_dy += done_dy + fee_y; // gross for input token
                    adjusted_dx += hmm_adj_x;
                    total_fee_y += fee_y;
                    curr_t = end_t;
                    curr_rp = end_rp;

                    // update global state to reflect price change (if any) & reserves
                    self.global_state.tick = curr_t;
                    self.global_state.rp = curr_rp;
                    self.x += done_dx - hmm_adj_x; // adj out of reserves into fees
                    self.y += done_dy;
                    self.x_adj += hmm_adj_x;
                    self.y_fee += fee_y;
                    if self.glbl_liq() > 0.0 {
                        // make sure not 0 liquidity (empty trade)
                        // * update fee growth to reflect latest swap_within
                        self.global_state.hg_x += hmm_adj_x / self.glbl_liq();
                        self.global_state.fg_y += fee_y / self.glbl_liq();
                    }

                    if cross == true {
                        assert!(end_t == gtk);
                        if self.active_ticks.contains_key(&gtk) {
                            self.cross_tick(gtk, left_to_right)
                        }
                    }
                }
            }
        }
        avg_p = if swpd_dx != 0.0 {
            -swpd_dy / swpd_dx
        } else {
            0.0
        };
        end_p = self.glbl_rp().powi(2);
        println!(
            "swpd_dX={} swpd_dY={} pool_X={} pool_Y={} avg_P={}, end_P={}",
            swpd_dx, swpd_dy, self.x, self.y, avg_p, end_p
        );
        println!(
            "adjusted_dX={}  pool_cumul_x_adj={} total_fee_y={}  pool_cumul_y_fee={}",
            adjusted_dx, self.x_adj, total_fee_y, self.y_fee
        );

        return (swpd_dx, swpd_dy, adjusted_dx, total_fee_y, avg_p, end_p);
    }
}
