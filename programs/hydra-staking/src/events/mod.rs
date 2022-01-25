use anchor_lang::prelude::*;

#[event]
pub struct PriceChange {
    pub old_base_per_quote_native: u64,
    pub new_base_per_quote_native: u64,
}
