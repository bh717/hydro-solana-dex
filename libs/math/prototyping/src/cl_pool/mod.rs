#![allow(dead_code)]
pub mod cl_math;

use std::collections::HashMap;
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
    tick: u128, // current tick
    fg_x: f64,  // fee growth global
    fg_y: f64,  // fee growth global
    hg_x: f64,  // fee growth global
    hg_y: f64,  // fee growth global
}

#[derive(Debug)]
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
pub struct PositionKey(String, u128, u128);

#[derive(Debug)]
pub struct Pool {
    token_x: Token,
    token_y: Token,
    tick_spacing: u128,
    global_state: GlobalState,
    active_sticks: HashMap<u128, TickState>,
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
        bootstrap_rp: f64,tick_spacing: u128,hmm_c: f64,fee_rate: f64,
    ) -> Pool {
        let tk = 1; //self.rP_to_possible_tick(bootstrap_rP, left_to_right=False)

        Pool {
            token_x: Token::new(x_name, x_decimals),
            token_y: Token::new(y_name, y_decimals),
            tick_spacing,
            global_state: GlobalState {
                liq: 0.0, rp: bootstrap_rp,tick: tk,
                fg_x: 0.0, fg_y: 0.0, hg_x: 0.0, hg_y: 0.0,
            },
            active_sticks: HashMap::new(),
            positions: HashMap::new(),
            x: 0.0, y: 0.0,
            x_adj: 0.0, y_adj: 0.0,
            x_fee: 0.0, y_fee: 0.0,
            c: hmm_c,fee_rate,
        }
    }
}
