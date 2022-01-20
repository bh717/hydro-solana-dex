use anchor_lang::prelude::*;

#[account]
#[derive(Debug, Default)]
pub struct State {
    pub token_mint: Pubkey,
    pub redeemable_mint: Pubkey,
}
impl State {}
