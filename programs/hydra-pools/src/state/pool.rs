use anchor_lang::prelude::*;

#[account]
pub struct Pool {
    pub data: i64,
}
