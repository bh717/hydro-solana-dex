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
        if liq < 0.0 {
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
    pub fn liq(&self) -> f64 {
        self.liq
    }
    pub fn add_liq(&mut self, liq: f64) {
        if self.liq + liq < 0.0 {
            panic!("global liquidity cannot turn negative");
        }
        self.liq += liq;
    }
    pub fn rp(&self) -> f64 {
        self.rp
    }
    pub fn set_rp(&mut self, rp: f64) {
        self.rp = rp;
    }
    pub fn tick(&self) -> u32 {
        self.tick
    }
    pub fn set_tick(&mut self, tick: u32) {
        self.tick = tick;
    }
    pub fn fee(&self, token: char, f_or_h: char) -> f64 {
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
    pub fn set_fee(&mut self, token: char, f_or_h: char, fee: f64) {
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
    pub fn all_fees(&self) -> (f64, f64, f64, f64) {
        (self.fg_x, self.fg_y, self.hg_x, self.hg_y)
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
        if liq_gross < 0.0 {
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
    pub fn liq_net(&self) -> f64 {
        self.liq_net
    }
    pub fn add_liq_net(&mut self, liq_net: f64) {
        self.liq_net += liq_net;
    }
    pub fn liq_gross(&self) -> f64 {
        self.liq_gross
    }
    pub fn add_liq_gross(&mut self, liq_gross: f64) {
        if self.liq_gross + liq_gross < 0.0 {
            panic!("gross liquidity cannot turn negative");
        }
        self.liq_gross += liq_gross;
    }
    pub fn fee(&self, token: char, f_or_h: char) -> f64 {
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
    pub fn set_fee(&mut self, token: char, f_or_h: char, fee: f64) {
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
    pub fn all_fees(&self) -> (f64, f64, f64, f64) {
        (self.f0_x, self.f0_y, self.h0_x, self.h0_y)
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
        if liq < 0.0 {
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
    pub fn liq(&self) -> f64 {
        self.liq
    }
    pub fn add_liq(&mut self, liq: f64) {
        if self.liq + liq < 0.0 {
            panic!("position liquidity cannot turn negative");
        }
        self.liq += liq;
    }
    pub fn fee(&self, token: char, f_or_h: char) -> f64 {
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
    pub fn set_fee(&mut self, token: char, f_or_h: char, fee: f64) {
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
    pub fn all_fees(&self) -> (f64, f64, f64, f64) {
        (self.fr_x, self.fr_y, self.hr_x, self.hr_y)
    }
}
