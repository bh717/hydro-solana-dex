use anchor_lang::prelude::*;

#[account]
pub struct Benchmark {
    pub num: i64,
}
