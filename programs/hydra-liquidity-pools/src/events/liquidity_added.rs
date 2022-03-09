use anchor_lang::prelude::*;

#[event]
pub struct LiquidityAdded {
    pub tokens_x_transferred: u64,
    pub tokens_y_transferred: u64,
    pub lp_tokens_minted: u64,
}
