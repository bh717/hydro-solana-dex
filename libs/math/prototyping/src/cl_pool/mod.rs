#![allow(dead_code)]
pub mod cl_math;

use std::collections::{HashMap,BTreeMap};
pub use cl_math::PoolMath;


// #[allow(dead_code)] // for indiv struct
#[derive(Debug)]
pub struct Token {
    name: String,
    decimals: u8,
}

impl Token {
    pub fn new(name: &str, decimals:u8  ) -> Self {
        Self { name : name.to_string(), decimals}
    }
}

#[derive(Debug)]
pub struct GlobalState {
    /// contract global state
    liq: f64, // liquidity
    rp: f64,    // sqrt price
    tick: u32, // current tick
    fg_x: f64,  // fee growth global
    fg_y: f64,  // fee growth global
    hg_x: f64,  // fee growth global
    hg_y: f64,  // fee growth global
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

#[derive(Debug)]
pub struct PositionState {
    ///Position Indexed State
    liq: f64, // liquidity
    fr_x: f64, // feegrowth inside last
    fr_y: f64, // feegrowth inside last
    hr_x: f64, // hmm adj-fee growth inside last
    hr_y: f64, // hmm adj-fee growth inside last
}

#[derive(Debug)]
pub struct PositionKey(String, u32, u32);

#[derive(Debug)]
pub struct Pool {
    token_x: Token,
    token_y: Token,
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

impl PoolMath for Pool {}

impl Pool {
    pub fn new(
        x_name: &str, x_decimals: u8, y_name: &str, y_decimals: u8,
        bootstrap_rp: f64, tick_spacing: u32,hmm_c: f64,fee_rate: f64,
    ) -> Pool {
        let tk = Self::rp_to_possible_tk(bootstrap_rp, tick_spacing, false);

        Pool {
            token_x: Token::new(x_name, x_decimals),
            token_y: Token::new(y_name, y_decimals),
            tick_spacing,
            global_state: GlobalState {
                liq: 0.0, rp: bootstrap_rp,tick: tk,
                fg_x: 0.0, fg_y: 0.0, hg_x: 0.0, hg_y: 0.0,
            },
            active_ticks: BTreeMap::new(),
            positions: HashMap::new(),
            x: 0.0, y: 0.0,
            x_adj: 0.0, y_adj: 0.0,
            x_fee: 0.0, y_fee: 0.0,
            c: hmm_c,fee_rate,
        }
    }

    pub fn glbl_tick (&self) -> u32 {
        self.global_state.tick
    }

    pub fn glbl_rp (&self) -> f64 {
        self.global_state.rp
    }
    pub fn fg_x (&self) -> f64 { self.global_state.fg_x }
    pub fn fg_y (&self) -> f64 { self.global_state.fg_y }
    pub fn hg_x (&self) -> f64 { self.global_state.hg_x }
    pub fn hg_y (&self) -> f64 { self.global_state.hg_y }

    pub fn get_tick_state_mut(&mut self, tick: u32) -> Option<&mut TickState> {
        self.active_ticks.get_mut(&tick)
    }


    fn tick_to_possible_tick(&self, tick: u32, left_to_right: bool ) -> u32 {
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
        let f0_x = if self.glbl_tick() >= tick {self.fg_x()} else {0.0}; 
        let f0_y = if self.glbl_tick() >= tick {self.fg_y()} else {0.0}; 

        let h0_x = if self.glbl_tick() >= tick {self.hg_x()} else {0.0}; 
        let h0_y = if self.glbl_tick() >= tick {self.hg_y()} else {0.0}; 

        let ts = TickState{
            liq_net:0.0, liq_gross:0.0, f0_x, f0_y, h0_x, h0_y
        };
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
        
        ts.liq_net += if !upper {liq_delta} else {-liq_delta};
        ts.liq_gross += liq_delta;

        if ts.liq_gross == 0.0 {
            // de-initialize tick when no longer ref'ed by a position
            self.unset_tick(tick);
        }
    }
    // fn get_sorted_ticks(&self) -> Vec<u32> {
    //     let mut tick_vec: Vec<u32> = self.active_ticks.keys().cloned().collect();
    //     tick_vec.sort_unstable();
    //     tick_vec
    // } 

    fn cross_tick(&mut self, provided_tick: u32, left_to_right: bool) {
        // Handle update of global state and tick state when initialized tick is crossed 
        // while performing swap
        if !left_to_right &&  self.glbl_tick() != provided_tick {
            panic!("can only cross current tick");
        }
        let ts = self.active_ticks.get_mut(&provided_tick)
        .expect("liquidity cannot turn negative");

        // add/substract to glabal liq depending on direction of crossing
        let liq_to_apply = if left_to_right  {ts.liq_net} else {-ts.liq_net};
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
            self.global_state.tick = self.tick_to_possible_tick(
                provided_tick - 1, left_to_right
            )
        }
    }

    fn get_left_limit_of_swap_within(&self, start_t:u32) -> Option<u32> {
        // get next available active tick from a starting point going left
        let tick = self.tick_to_possible_tick(
            start_t.min(self.glbl_tick()), false
        );
        for &tk in self.active_ticks.keys().rev() { // descending
            if tk <= tick {
                // case when  starting_rP equals exactly tick_torP(current tick)
                // is covered in swap method (will do 0-qty and trigger cross)
                return Some(tk);
            }
            continue;   // ignore ticks above current tick
        }
        None
    }

    fn get_right_limit_of_swap_within(&self, start_t: u32, glbl_tick: u32 ) -> Option<u32> {
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
            for &tk in self.active_ticks.keys() { // ascending
                if tk > start_tick {
                    return Some(tk);
                }
                continue;   // ignore current tick and below
            }
        } else if start_tick > glbl_tick {
            // the global rP has already travelled to the tick above the
            // current global tick (WITHOUT CROSSING over it left to right)
            // so liqudity-wise we are still in the range of current_tick
            // in this case we are looking for the 1st active tick
            // above AND possibly INCLUDING start_tick. If start_tick is indeed
            // part of active_ticks, the very next swap_within_from_Y will
            // result in a 0_qty swap and trigger a crossing to the right
            for &tk in self.active_ticks.keys() { // ascending
                if tk >= start_tick {
                    return Some(tk);
                }
                continue;   // ignore current tick and below
            }
        } else {
            panic!("we do not expect global rP to ever be strictly below current global tick");
        }
        None
    }

    pub fn ticks_cloned(&self) -> BTreeMap<u32, TickState> {
        self.active_ticks.clone()
    }

    fn try_get_in_range(&mut self, left_to_right: bool) -> (Option<u32>, u32, f64) {
        // During swap, when no liquidity in current state, find next active tick, cross it  to
        // kick-in some liquidity. return (new_goal_tick or None, glbl_tick and glbl_rP). 
        if self.global_state.liq > 0.0 {
            panic!("there already is liquidity in range");
        }

        // let keys: Vec<u32> = self.active_ticks.into_keys().rev().collect();
        

        if !left_to_right { // going right to left, X in Y out
            for &tk in self.ticks_cloned().keys().rev() { // descending
                if tk > self.global_state.tick {
                    continue; // ignore ticks above current tick
                }
                self.global_state.tick = tk;
                self.global_state.rp = Self::tick_to_rp(tk);
                self.cross_tick(tk, left_to_right);
                // crossing shud put glbl_state.tick 1 (possible) tick under tk
                // set the next goal for swap
                let new_goal = self.get_left_limit_of_swap_within(
                    self.global_state.tick
                );
                // at this point some Liquidity should have kicked in
                if self.global_state.liq < 0.0 { 
                    panic!("from being out of range, we don't expect to kick in negative liquidity");
                }
                if self.global_state.liq > 0.0 {
                    // * return next goal (1 tick under tk) and tk just crossed
                    return (new_goal, tk , self.global_state.rp);
                }
            }
        } else {
            for &tk in self.ticks_cloned().keys() { // ascending
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
        return (None, self.glbl_tick() , self.glbl_rp()); 
    }





}
