use anchor_lang::prelude::*;

#[event]
pub struct LiquidityAdded {
    pub tokens_a_transferred: u64,
    pub tokens_b_transferred: u64,
    pub lp_tokens_minted: u64,
}
