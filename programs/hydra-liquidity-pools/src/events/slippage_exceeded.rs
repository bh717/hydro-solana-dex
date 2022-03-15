use anchor_lang::prelude::*;

#[event]
pub struct SlippageExceeded {
    pub token_x_to_debit: u64,
    pub token_y_to_debit: u64,
    pub token_x_max_amount: u64,
    pub token_y_max_amount: u64,
}
