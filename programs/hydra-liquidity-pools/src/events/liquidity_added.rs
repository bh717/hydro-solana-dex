use anchor_lang::prelude::*;

#[event]
pub struct LiquidityAdded {
    pub base_tokens_transferred: u64,
    pub quote_tokens_transferred: u64,
    pub lp_tokens_minted: u64,
}
