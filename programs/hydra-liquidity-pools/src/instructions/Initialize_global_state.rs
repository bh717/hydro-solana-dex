use crate::constants::*;
use crate::state::pool_state::PoolState;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct InitializeGlobalState {
    // TODO .. build .. initialize god mode access across all pools. ie for a DOA/multi-sig address
}
