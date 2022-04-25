use crate::decimal::{Decimal, COMPUTE_SCALE};
use crate::programs::fees::fee_calculator::FeeCalculatorBuilder;
use wasm_bindgen::prelude::wasm_bindgen;

/// Interface to be used by programs and front end
/// these functions shadow functions of the implemented fee calculator
#[wasm_bindgen]
pub fn compute_volatility_adjusted_fee(
    this_price: u64,
    last_price: u64,
    price_scale: u8,
    last_update: u64,
    last_ewma: u64,
    amount: u64,
    amount_scale: u8,
) -> Result<Vec<u64>, String> {
    let this_price = Decimal::from_scaled_amount(this_price, price_scale).to_compute_scale();
    let last_price = Decimal::from_scaled_amount(last_price, price_scale).to_compute_scale();
    let last_update = Decimal::from_u64(last_update).to_compute_scale();
    let last_ewma = Decimal::from_scaled_amount(last_ewma, COMPUTE_SCALE);
    let amount = Decimal::from_scaled_amount(amount, amount_scale).to_compute_scale();
    let fee_calculator = FeeCalculatorBuilder::default()
        .vol_adj_fee_this_price(this_price)
        .vol_adj_fee_last_price(last_price)
        .vol_adj_fee_last_update(last_update)
        .vol_adj_fee_last_ewma(last_ewma)
        .build()
        .expect("failed to build FeeCalculator");

    let fee_result = fee_calculator.compute_vol_adj_fee(&amount).unwrap();

    Ok(fee_result.into())
}

// TODO: add specs for compute_volatility_adjusted_fee via wasm scalar inputs
