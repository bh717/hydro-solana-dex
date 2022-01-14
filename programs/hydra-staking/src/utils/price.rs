use anchor_lang::prelude::Account;
use anchor_spl::token::{Mint, TokenAccount};
use std::cmp::min;

const ONE_E9: u64 = 1000000000;

/// calculate price
pub fn calc_price<'info>(
    vault: &Account<'info, TokenAccount>,
    mint: &Account<'info, Mint>,
) -> (u64, String) {
    let total_vault_token = vault.amount;
    let total_x_token = mint.supply;

    if total_x_token == 0 {
        return (0, String::from("0"));
    }

    // (total_vault_token * 1e9 ) / total_x_token.supply
    let price_uint = total_vault_token
        .checked_mul(ONE_E9)
        .unwrap()
        .checked_div(total_x_token)
        .unwrap();

    let price_float = (total_vault_token as f64) / (total_x_token as f64);
    (price_uint, price_float.to_string())
}
