use wasm_bindgen::prelude::*;

/// deposit tokens into pool
// (amount * total_x_token.supply) / total_token_vault
#[wasm_bindgen]
pub fn calc_pool_tokens_for_deposit(
    amount: u64,
    total_token_vault: u64,
    total_redeemable_tokens: u64,
) -> u64 {
    use spl_math::precise_number::PreciseNumber;
    let amount = PreciseNumber::new(amount as u128).unwrap();
    let total_token_vault = PreciseNumber::new(total_token_vault as u128).unwrap();
    let total_redeemable_tokens = PreciseNumber::new(total_redeemable_tokens as u128).unwrap();

    //  as u64
    let out = (amount)
        .checked_mul(&total_redeemable_tokens)
        .unwrap()
        .checked_div(&total_token_vault)
        .unwrap()
        .floor()
        .unwrap()
        .to_imprecise()
        .unwrap();

    out as u64
}
