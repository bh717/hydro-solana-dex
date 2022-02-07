use anchor_lang::prelude::*;

#[event]
pub struct SlippageExceeded {
    pub minimum_lp_tokens_requested_by_user: u64,
    pub lp_tokens_to_issue: u64,
}
