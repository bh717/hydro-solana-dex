use anchor_lang::prelude::*;

#[event]
pub struct LiquidityRemoved {
    pub tokens_x_credited: u64,
    pub tokens_y_credited: u64,
    pub lp_tokens_burnt: u64,
}
