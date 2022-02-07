use anchor_lang::prelude::*;

#[event]
pub struct LpTokensIssued {
    pub amount: u64,
}
