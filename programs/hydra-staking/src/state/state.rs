use anchor_lang::prelude::*;

#[account]
#[derive(Debug, Default)]
pub struct State {
    pub authority: Pubkey, // TODO is this needed?
    pub token_mint: Pubkey,
    pub redeemable_mint: Pubkey,
    pub state_bump_seed: u8, // TODO is this needed too?
    pub vault_bump_seed: u8, // TODO same?
}
impl State {}
