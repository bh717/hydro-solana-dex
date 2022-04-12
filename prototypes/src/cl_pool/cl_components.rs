use hydra_math_rs::decimal::{Add, Decimal};

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
    liq: Decimal, // liquidity
    rp: Decimal,   // sqrt price
    tick: u128,    // current tick
    fg_x: Decimal, // fee growth global
    fg_y: Decimal, // fee growth global
    hg_x: Decimal, // fee growth global
    hg_y: Decimal, // fee growth global
}

impl GlobalState {
    pub fn new(
        liq: Decimal,
        rp: Decimal,
        tick: u128,
        fg_x: Decimal,
        fg_y: Decimal,
        hg_x: Decimal,
        hg_y: Decimal,
    ) -> Self {
        if liq.is_negative() {
            panic!("global liquidity cannot be negative");
        }
        if rp.is_negative() {
            panic!("global root-price cannot be negative");
        }
        if fg_x.is_negative() || fg_y.is_negative() || hg_x.is_negative() || hg_y.is_negative() {
            panic!("fee cannot be negative");
        }
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
    pub fn liq(&self) -> Decimal {
        self.liq
    }
    pub fn add_liq(&mut self, liq_to_add: Decimal) {
        // let new_liq_tup = signed_addition(&self.liq.amt, self.liq.neg, &liq.amt, liq.neg);
        let new_liq = self.liq().add(liq_to_add).expect("new_liquidity");
        if new_liq.is_negative() {
            panic!("global liquidity cannot turn negative");
        }
        self.liq = new_liq;
    }
    pub fn rp(&self) -> Decimal {
        self.rp
    }
    pub fn set_rp(&mut self, rp: Decimal) {
        self.rp = rp;
    }
    pub fn tick(&self) -> u128 {
        self.tick
    }
    pub fn set_tick(&mut self, tick: u128) {
        self.tick = tick;
    }
    pub fn fee(&self, token: char, f_or_h: char) -> Decimal {
        match (token, f_or_h) {
            ('x', 'f') => self.fg_x,
            ('y', 'f') => self.fg_y,
            ('x', 'h') => self.hg_x,
            ('y', 'h') => self.hg_y,
            _ => {
                panic!("not a valid fee type");
            }
        }
    }
    pub fn set_fee(&mut self, token: char, f_or_h: char, fee: Decimal) {
        match (token, f_or_h) {
            ('x', 'f') => self.fg_x = fee,
            ('y', 'f') => self.fg_y = fee,
            ('x', 'h') => self.hg_x = fee,
            ('y', 'h') => self.hg_y = fee,
            _ => {
                panic!("not a valid fee type");
            }
        };
    }
    pub fn all_fees(&self) -> (Decimal, Decimal, Decimal, Decimal) {
        (self.fg_x, self.fg_y, self.hg_x, self.hg_y)
    }
}

#[derive(Debug, Clone)]
pub struct TickState {
    ///Tick Indexed State
    liq_net: Decimal, // LiquidityNet
    liq_gross: Decimal, // LiquidityGross
    f0_x: Decimal,      // feegrowth outside
    f0_y: Decimal,      // feegrowth outside
    h0_x: Decimal,      // hmm adj-fee growth outside
    h0_y: Decimal,      // hmm adj-fee growth outside
}

impl TickState {
    pub fn new(
        liq_net: Decimal,
        liq_gross: Decimal,
        f0_x: Decimal,
        f0_y: Decimal,
        h0_x: Decimal,
        h0_y: Decimal,
    ) -> Self {
        if liq_gross.is_negative() {
            panic!("gross liquidity cannot be negative");
        }
        if f0_x.is_negative() || f0_y.is_negative() || h0_x.is_negative() || h0_y.is_negative() {
            panic!("fee cannot be negative");
        }
        TickState {
            liq_net,
            liq_gross,
            f0_x,
            f0_y,
            h0_x,
            h0_y,
        }
    }
    pub fn liq_net(&self) -> Decimal {
        self.liq_net
    }
    pub fn add_liq_net(&mut self, liq_net_to_add: Decimal) {
        self.liq_net = self.liq_net().add(liq_net_to_add).unwrap();
    }
    pub fn liq_gross(&self) -> Decimal {
        self.liq_gross
    }
    pub fn add_liq_gross(&mut self, liq_gross_to_add: Decimal) {
        let new_liq_gross = self.liq_gross().add(liq_gross_to_add).unwrap();
        if new_liq_gross.is_negative() {
            panic!("gross liquidity cannot turn negative");
        }
        self.liq_gross = new_liq_gross;
    }
    pub fn fee(&self, token: char, f_or_h: char) -> Decimal {
        match (token, f_or_h) {
            ('x', 'f') => self.f0_x,
            ('y', 'f') => self.f0_y,
            ('x', 'h') => self.h0_x,
            ('y', 'h') => self.h0_y,
            _ => {
                panic!("not a valid fee type");
            }
        }
    }
    pub fn set_fee(&mut self, token: char, f_or_h: char, fee: Decimal) {
        match (token, f_or_h) {
            ('x', 'f') => self.f0_x = fee,
            ('y', 'f') => self.f0_y = fee,
            ('x', 'h') => self.h0_x = fee,
            ('y', 'h') => self.h0_y = fee,
            _ => {
                panic!("not a valid fee type");
            }
        };
    }
    pub fn all_fees(&self) -> (Decimal, Decimal, Decimal, Decimal) {
        (self.f0_x, self.f0_y, self.h0_x, self.h0_y)
    }
}
#[derive(Debug)]
pub struct PositionState {
    ///Position Indexed State
    liq: Decimal, // liquidity
    fr_x: Decimal, // feegrowth inside last
    fr_y: Decimal, // feegrowth inside last
    hr_x: Decimal, // hmm adj-fee growth inside last
    hr_y: Decimal, // hmm adj-fee growth inside last
}

impl PositionState {
    pub fn new(liq: Decimal, fr_x: Decimal, fr_y: Decimal, hr_x: Decimal, hr_y: Decimal) -> Self {
        if liq.is_negative() {
            panic!("position liquidity cannot be negative");
        }
        if fr_x.is_negative() || fr_y.is_negative() || hr_x.is_negative() || hr_y.is_negative() {
            panic!("fee cannot be negative");
        }
        Self {
            liq,
            fr_x,
            fr_y,
            hr_x,
            hr_y,
        }
    }
    pub fn liq(&self) -> Decimal {
        self.liq
    }
    pub fn add_liq(&mut self, liq_to_add: Decimal) {
        let new_liq = self.liq().add(liq_to_add).unwrap();
        if new_liq.is_negative() {
            panic!("position liquidity cannot turn negative");
        }
        self.liq = new_liq;
    }

    pub fn fee(&self, token: char, f_or_h: char) -> Decimal {
        match (token, f_or_h) {
            ('x', 'f') => self.fr_x,
            ('y', 'f') => self.fr_y,
            ('x', 'h') => self.hr_x,
            ('y', 'h') => self.hr_y,
            _ => {
                panic!("not a valid fee type");
            }
        }
    }
    pub fn set_fee(&mut self, token: char, f_or_h: char, fee: Decimal) {
        match (token, f_or_h) {
            ('x', 'f') => self.fr_x = fee,
            ('y', 'f') => self.fr_y = fee,
            ('x', 'h') => self.hr_x = fee,
            ('y', 'h') => self.hr_y = fee,
            _ => {
                panic!("not a valid fee type");
            }
        };
    }
    pub fn all_fees(&self) -> (Decimal, Decimal, Decimal, Decimal) {
        (self.fr_x, self.fr_y, self.hr_x, self.hr_y)
    }
}

// #[derive(Debug, Clone, PartialEq)]
// pub struct Swp {
//     // struct to represent swap token quantity (positive or negative) in PreciseNumber
//     pub amt: PN,
//     pub neg: bool,
// }

// impl Swp {
//     pub fn new(amt: PN, neg: bool) -> Self {
//         Self { amt, neg }
//     }
//     pub fn from_tuple(tup: (PN, bool)) -> Self {
//         Self::new(tup.0, tup.1)
//     }
//     pub fn add(&self, rhs: &Swp) -> Swp {
//         Swp::from_tuple(signed_addition(&self.amt, self.neg, &rhs.amt, rhs.neg))
//     }
//     pub fn flip_sign(&self) -> Self {
//         Self::new(self.amt.clone(), !self.neg)
//     }
// }

#[derive(Debug)]
pub struct GetInRangeOutput {
    goal_tick: Option<u128>,
    new_rp: Decimal,
}

impl GetInRangeOutput {
    pub fn new(goal_tick: Option<u128>, new_rp: Decimal) -> Self {
        if new_rp.is_negative() {
            panic!("root-price cannot be negative");
        }
        Self { goal_tick, new_rp }
    }
    pub fn goal_tick(&self) -> Option<u128> {
        self.goal_tick
    }
    pub fn new_rp(&self) -> Decimal {
        self.new_rp
    }
}

#[derive(Debug)]
pub struct SwapWithinResult {
    recv_amount: Decimal,
    send_amount: Decimal,
    end_tick: u128,
    end_rp: Decimal,
    cross: bool,
    send_hmm_adj: Decimal,
    recv_fee: Decimal,
}
// (done_dx, done_dy, end_t, end_rp, cross, hmm_adj_y, fee_x)

impl SwapWithinResult {
    pub fn new(
        recv_amount: Decimal,
        send_amount: Decimal,
        end_tick: u128,
        end_rp: Decimal,
        cross: bool,
        send_hmm_adj: Decimal,
        recv_fee: Decimal,
    ) -> Self {
        if recv_amount.is_negative() {
            panic!("in-qty cannot be negative");
        }
        if send_amount.is_positive() {
            // allow zero qty swap_within
            panic!("out-qty cannot be positive");
        }
        if send_hmm_adj.is_negative() || recv_fee.is_negative() {
            panic!("fees cannot be negative");
        }
        if end_rp.is_negative() {
            panic!("root-price cannot be negative");
        }
        Self {
            recv_amount,
            send_amount,
            end_tick,
            end_rp,
            cross,
            send_hmm_adj,
            recv_fee,
        }
    }
    pub fn recv_amount(&self) -> Decimal {
        self.recv_amount
    }
    pub fn send_amount(&self) -> Decimal {
        self.send_amount
    }
    pub fn end_tick(&self) -> u128 {
        self.end_tick
    }
    pub fn end_rp(&self) -> Decimal {
        self.end_rp
    }
    pub fn cross(&self) -> bool {
        self.cross
    }
    pub fn send_hmm_adj(&self) -> Decimal {
        self.send_hmm_adj
    }
    pub fn recv_fee(&self) -> Decimal {
        self.recv_fee
    }
}

#[derive(Debug, PartialEq)]
pub struct SwapOutput {
    recv_amount: Decimal,
    send_amount: Decimal,
    send_hmm_adj: Decimal,
    recv_fee: Decimal,
    avg_price: Decimal,
    end_price: Decimal,
}
// (swpd_dx, swpd_dy, adjusted_dy, total_fee_x, avg_p, end_p)

impl SwapOutput {
    pub fn new(
        recv_amount: Decimal,
        send_amount: Decimal,
        send_hmm_adj: Decimal,
        recv_fee: Decimal,
        avg_price: Decimal,
        end_price: Decimal,
    ) -> Self {
        if recv_amount.is_negative() || recv_amount.is_zero() {
            panic!("in-qty cannot be negative or nil");
        }
        if send_amount.is_positive() || send_amount.is_zero() {
            // do not allow zero output for positive input
            panic!("out-qty cannot be positive or nil for positive in-qty");
        }
        if send_hmm_adj.is_negative() || recv_fee.is_negative() {
            panic!("fees cannot be negative");
        }
        if avg_price.is_negative() || end_price.is_negative() {
            panic!("price cannot be negative");
        }
        Self {
            recv_amount,
            send_amount,
            send_hmm_adj,
            recv_fee,
            avg_price,
            end_price,
        }
    }
    pub fn recv_amount(&self) -> Decimal {
        self.recv_amount
    }
    pub fn send_amount(&self) -> Decimal {
        self.send_amount
    }
    pub fn send_hmm_adj(&self) -> Decimal {
        self.send_hmm_adj
    }
    pub fn recv_fee(&self) -> Decimal {
        self.recv_fee
    }
    pub fn avg_price(&self) -> Decimal {
        self.avg_price
    }
    pub fn end_price(&self) -> Decimal {
        self.end_price
    }
}
