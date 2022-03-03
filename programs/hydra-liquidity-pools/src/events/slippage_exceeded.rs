use anchor_lang::prelude::*;

#[event]
pub struct SlippageExceeded {
    pub base_token_to_debit: u64,
    pub quote_token_to_debit: u64,
    pub base_token_max_amount: u64,
    pub quote_token_max_amount: u64,
}
