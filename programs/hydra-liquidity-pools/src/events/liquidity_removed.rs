use anchor_lang::prelude::*;

#[event]
pub struct LiquidityRemoved {
    pub tokens_a_credited: u64,
    pub tokens_b_credited: u64,
    pub lp_tokens_burnt: u64,
}
