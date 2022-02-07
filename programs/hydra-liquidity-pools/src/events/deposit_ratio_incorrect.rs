use anchor_lang::prelude::*;

#[event]
pub struct DepositRatioIncorrect {
    pub x: u64,
    pub y: u64,
    pub x_total: u64,
    pub y_total: u64,
}
