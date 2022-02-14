use anchor_lang::prelude::*;

#[event]
pub struct TokensTransferred {
    pub token_a: u64,
    pub token_b: u64,
}
