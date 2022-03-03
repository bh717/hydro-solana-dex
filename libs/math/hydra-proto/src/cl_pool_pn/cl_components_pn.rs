use crate::cl_pool_pn::hydra_math_legacy::signed_addition;
use spl_math::precise_number::PreciseNumber as PN;

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

#[derive(Debug, Clone)]
pub struct Liq {
    // struct to represent liquidity (positive or negative) in PreciseNumber
    pub amt: PN,
    pub neg: bool,
}

impl Liq {
    pub fn new(amt: PN, neg: bool) -> Self {
        Self { amt, neg }
    }
    pub fn from_tuple(tup: (PN, bool)) -> Self {
        Self::new(tup.0, tup.1)
    }
    pub fn flip_sign(&self) -> Self {
        Self::new(self.amt.clone(), !self.neg)
    }
    pub fn add(&self, rhs: &Liq) -> Liq {
        Liq::from_tuple(signed_addition(&self.amt, self.neg, &rhs.amt, rhs.neg))
    }
}

#[derive(Debug)]
pub struct GlobalState {
    /// contract global state
    liq: Liq, // liquidity
    rp: PN,     // sqrt price
    tick: u128, // current tick
    fg_x: PN,   // fee growth global
    fg_y: PN,   // fee growth global
    hg_x: PN,   // fee growth global
    hg_y: PN,   // fee growth global
}

impl GlobalState {
    pub fn new(liq: Liq, rp: PN, tick: u128, fg_x: PN, fg_y: PN, hg_x: PN, hg_y: PN) -> Self {
        if liq.neg {
            panic!("global liquidity cannot be negative");
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
    pub fn liq(&self) -> &Liq {
        &self.liq
    }
    pub fn add_liq(&mut self, liq: &Liq) {
        let new_liq_tup = signed_addition(&self.liq.amt, self.liq.neg, &liq.amt, liq.neg);
        if new_liq_tup.1 {
            panic!("global liquidity cannot turn negative");
        }
        self.liq = Liq::from_tuple(new_liq_tup);
    }
    pub fn rp(&self) -> PN {
        self.rp.clone()
    }
    pub fn set_rp(&mut self, rp: &PN) {
        self.rp = rp.clone();
    }
    pub fn tick(&self) -> u128 {
        self.tick
    }
    pub fn set_tick(&mut self, tick: u128) {
        self.tick = tick;
    }
    pub fn fee(&self, token: char, f_or_h: char) -> PN {
        match (token, f_or_h) {
            ('x', 'f') => self.fg_x.clone(),
            ('y', 'f') => self.fg_y.clone(),
            ('x', 'h') => self.hg_x.clone(),
            ('y', 'h') => self.hg_y.clone(),
            _ => {
                panic!("not a valid fee type");
            }
        }
    }
    pub fn set_fee(&mut self, token: char, f_or_h: char, fee: &PN) {
        match (token, f_or_h) {
            ('x', 'f') => self.fg_x = fee.clone(),
            ('y', 'f') => self.fg_y = fee.clone(),
            ('x', 'h') => self.hg_x = fee.clone(),
            ('y', 'h') => self.hg_y = fee.clone(),
            _ => {
                panic!("not a valid fee type");
            }
        };
    }
    pub fn all_fees(&self) -> (PN, PN, PN, PN) {
        (
            self.fg_x.clone(),
            self.fg_y.clone(),
            self.hg_x.clone(),
            self.hg_y.clone(),
        )
    }
}

#[derive(Debug, Clone)]
pub struct TickState {
    ///Tick Indexed State
    liq_net: Liq, // LiquidityNet
    liq_gross: Liq, // LiquidityGross
    f0_x: PN,       // feegrowth outside
    f0_y: PN,       // feegrowth outside
    h0_x: PN,       // hmm adj-fee growth outside
    h0_y: PN,       // hmm adj-fee growth outside
}

impl TickState {
    pub fn new(liq_net: Liq, liq_gross: Liq, f0_x: PN, f0_y: PN, h0_x: PN, h0_y: PN) -> Self {
        if liq_gross.neg {
            panic!("gross liquidity cannot be negative");
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
    pub fn liq_net(&self) -> &Liq {
        &self.liq_net
    }
    pub fn add_liq_net(&mut self, liq_net: &Liq) {
        let new_liq_net_tup = signed_addition(
            &self.liq_net.amt,
            self.liq_net.neg,
            &liq_net.amt,
            liq_net.neg,
        );
        self.liq_net = Liq::from_tuple(new_liq_net_tup);
    }
    pub fn liq_gross(&self) -> &Liq {
        &self.liq_gross
    }
    pub fn add_liq_gross(&mut self, liq_gross: &Liq) {
        let new_liq_gross_tup = signed_addition(
            &self.liq_gross.amt,
            self.liq_gross.neg,
            &liq_gross.amt,
            liq_gross.neg,
        );
        if new_liq_gross_tup.1 {
            panic!("gross liquidity cannot turn negative");
        }
        self.liq_gross = Liq::from_tuple(new_liq_gross_tup);
    }
    pub fn fee(&self, token: char, f_or_h: char) -> PN {
        match (token, f_or_h) {
            ('x', 'f') => self.f0_x.clone(),
            ('y', 'f') => self.f0_y.clone(),
            ('x', 'h') => self.h0_x.clone(),
            ('y', 'h') => self.h0_y.clone(),
            _ => {
                panic!("not a valid fee type");
            }
        }
    }
    pub fn set_fee(&mut self, token: char, f_or_h: char, fee: &PN) {
        match (token, f_or_h) {
            ('x', 'f') => self.f0_x = fee.clone(),
            ('y', 'f') => self.f0_y = fee.clone(),
            ('x', 'h') => self.h0_x = fee.clone(),
            ('y', 'h') => self.h0_y = fee.clone(),
            _ => {
                panic!("not a valid fee type");
            }
        };
    }
    pub fn all_fees(&self) -> (PN, PN, PN, PN) {
        (
            self.f0_x.clone(),
            self.f0_y.clone(),
            self.h0_x.clone(),
            self.h0_y.clone(),
        )
    }
}
#[derive(Debug)]
pub struct PositionState {
    ///Position Indexed State
    liq: Liq, // liquidity
    fr_x: PN, // feegrowth inside last
    fr_y: PN, // feegrowth inside last
    hr_x: PN, // hmm adj-fee growth inside last
    hr_y: PN, // hmm adj-fee growth inside last
}

impl PositionState {
    pub fn new(liq: Liq, fr_x: PN, fr_y: PN, hr_x: PN, hr_y: PN) -> Self {
        if liq.neg {
            panic!("position liquidity cannot be negative");
        }
        Self {
            liq,
            fr_x,
            fr_y,
            hr_x,
            hr_y,
        }
    }
    pub fn liq(&self) -> &Liq {
        &self.liq
    }
    pub fn add_liq(&mut self, liq: &Liq) {
        let new_liq_tup = signed_addition(&self.liq.amt, self.liq.neg, &liq.amt, liq.neg);
        if new_liq_tup.1 {
            panic!("position liquidity cannot turn negative");
        }
        self.liq = Liq::from_tuple(new_liq_tup);
    }

    pub fn fee(&self, token: char, f_or_h: char) -> &PN {
        match (token, f_or_h) {
            ('x', 'f') => &self.fr_x,
            ('y', 'f') => &self.fr_y,
            ('x', 'h') => &self.hr_x,
            ('y', 'h') => &self.hr_y,
            _ => {
                panic!("not a valid fee type");
            }
        }
    }
    pub fn set_fee(&mut self, token: char, f_or_h: char, fee: &PN) {
        match (token, f_or_h) {
            ('x', 'f') => self.fr_x = fee.clone(),
            ('y', 'f') => self.fr_y = fee.clone(),
            ('x', 'h') => self.hr_x = fee.clone(),
            ('y', 'h') => self.hr_y = fee.clone(),
            _ => {
                panic!("not a valid fee type");
            }
        };
    }
    pub fn all_fees(&self) -> (PN, PN, PN, PN) {
        (
            self.fr_x.clone(),
            self.fr_y.clone(),
            self.hr_x.clone(),
            self.hr_y.clone(),
        )
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Swp {
    // struct to represent swap token quantity (positive or negative) in PreciseNumber
    pub amt: PN,
    pub neg: bool,
}

impl Swp {
    pub fn new(amt: PN, neg: bool) -> Self {
        Self { amt, neg }
    }
    pub fn from_tuple(tup: (PN, bool)) -> Self {
        Self::new(tup.0, tup.1)
    }
    pub fn add(&self, rhs: &Swp) -> Swp {
        Swp::from_tuple(signed_addition(&self.amt, self.neg, &rhs.amt, rhs.neg))
    }
    pub fn flip_sign(&self) -> Self {
        Self::new(self.amt.clone(), !self.neg)
    }
}

#[derive(Debug)]
pub struct GetInRangeOutput {
    goal_tick: Option<u128>,
    new_rp: PN,
}

impl GetInRangeOutput {
    pub fn new(goal_tick: Option<u128>, new_rp: &PN) -> Self {
        Self {
            goal_tick,
            new_rp: new_rp.clone(),
        }
    }
    pub fn goal_tick(&self) -> Option<u128> {
        self.goal_tick
    }
    pub fn new_rp(&self) -> PN {
        self.new_rp.clone()
    }
}

#[derive(Debug)]
pub struct SwapWithinResult {
    recv_amount: Swp,
    send_amount: Swp,
    end_tick: u128,
    end_rp: PN,
    cross: bool,
    send_hmm_adj: PN,
    recv_fee: PN,
}
// (done_dx, done_dy, end_t, end_rp, cross, hmm_adj_y, fee_x)

impl SwapWithinResult {
    pub fn new(
        recv_amount: Swp,
        send_amount: Swp,
        end_tick: u128,
        end_rp: PN,
        cross: bool,
        send_hmm_adj: PN,
        recv_fee: PN,
    ) -> Self {
        if recv_amount.neg {
            panic!("in-qty cannot be negative");
        }
        if !send_amount.neg && send_amount.amt.greater_than(&PN::new(0).unwrap()) {
            // allow zero qty swap_within
            panic!("out-qty cannot be positive");
        }
        // if send_hmm_adj < 0.0 || recv_fee < 0.0 {
        //     panic!("fees cannot be negative");
        // }
        // if end_rp < 0.0 {
        //     panic!("root-price cannot be negative");
        // }
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
    pub fn recv_amount(&self) -> &Swp {
        &self.recv_amount
    }
    pub fn send_amount(&self) -> &Swp {
        &self.send_amount
    }
    pub fn end_tick(&self) -> u128 {
        self.end_tick
    }
    pub fn end_rp(&self) -> PN {
        self.end_rp.clone()
    }
    pub fn cross(&self) -> bool {
        self.cross
    }
    pub fn send_hmm_adj(&self) -> PN {
        self.send_hmm_adj.clone()
    }
    pub fn recv_fee(&self) -> PN {
        self.recv_fee.clone()
    }
}

#[derive(Debug, PartialEq)]
pub struct SwapOutput {
    recv_amount: Swp,
    send_amount: Swp,
    send_hmm_adj: PN,
    recv_fee: PN,
    avg_price: PN,
    end_price: PN,
}
// (swpd_dx, swpd_dy, adjusted_dy, total_fee_x, avg_p, end_p)

impl SwapOutput {
    pub fn new(
        recv_amount: Swp,
        send_amount: Swp,
        send_hmm_adj: PN,
        recv_fee: PN,
        avg_price: PN,
        end_price: PN,
    ) -> Self {
        if recv_amount.neg {
            panic!("in-qty cannot be negative");
        }
        if !send_amount.neg {
            // do not allow zero output for positive input
            panic!("out-qty cannot be positive or nil for positive in-qty");
        }
        // if send_hmm_adj < 0.0 || recv_fee < 0.0 {
        //     panic!("fees cannot be negative");
        // }
        // if avg_price < 0.0 || end_price < 0.0 {
        //     panic!("price cannot be negative");
        // }
        Self {
            recv_amount,
            send_amount,
            send_hmm_adj,
            recv_fee,
            avg_price,
            end_price,
        }
    }
    pub fn recv_amount(&self) -> &Swp {
        &self.recv_amount
    }
    pub fn send_amount(&self) -> &Swp {
        &self.send_amount
    }
    pub fn send_hmm_adj(&self) -> PN {
        self.send_hmm_adj.clone()
    }
    pub fn recv_fee(&self) -> PN {
        self.recv_fee.clone()
    }
    pub fn avg_price(&self) -> PN {
        self.avg_price.clone()
    }
    pub fn end_price(&self) -> PN {
        self.end_price.clone()
    }
}
