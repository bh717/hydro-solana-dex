use anchor_lang::prelude::*;

#[event]
pub struct LpTokensMinted {
    pub amount: u64,
}
