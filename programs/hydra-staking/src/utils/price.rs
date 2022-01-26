use crate::state::pool_state::PoolState;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};

/// calculate price
pub fn calculate_price<'info>(
    vault: &Account<'info, TokenAccount>,
    mint: &Account<'info, Mint>,
    pool_state: &Account<'info, PoolState>,
) -> u64 {
    let total_vault_token = vault.amount;
    let total_redeemable_token = mint.supply;

    if total_redeemable_token == 0 {
        msg!("total_redeemable_token: 0");
        return 0;
    }

    let decimals = 10u64.pow(pool_state.token_mint_decimals as u32);

    // (total_vault_token * 10^9 ) / total_x_token.supply
    let price_uint = total_vault_token
        .checked_mul(decimals)
        .unwrap()
        .checked_div(total_redeemable_token)
        .unwrap();

    price_uint
}
