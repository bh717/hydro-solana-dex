use anchor_lang::prelude::*;

#[event]
pub struct SlippageExceeded {
    pub token_a_to_debit: u64,
    pub token_b_to_debit: u64,
    pub token_a_max_amount: u64,
    pub token_b_max_amount: u64,
}
