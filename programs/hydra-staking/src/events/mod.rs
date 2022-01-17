use anchor_lang::prelude::*;

#[event]
pub struct PriceChange {
    pub old_hyd_per_xhyd_1e9: u64,
    pub old_hyd_per_xhyd: String,
    pub new_hyd_per_xhyd_1e9: u64,
    pub new_hyd_per_xhyd: String,
}

#[event]
pub struct Price {
    pub hyd_per_xhyd_1e9: u64,
    pub hyd_per_xhyd: String,
}
