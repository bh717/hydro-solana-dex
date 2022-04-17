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

// #[test]
// fn test_compute_vol_adj_fee_wasm() {
//     // first time called with 'zero' input for last_price, last_update and last_ewma
//     {
//         let actual =
//             compute_volatility_adjusted_fee(3400_000000, 0, 6, 0, 0, 1000_000000, 6).unwrap();
//         let result = FeeResult::from(actual);
//         let expected = FeeResult {
//             fees: 5351086800000,
//             amount_ex_fees: 994648913200000,
//             last_update: 1649549126,
//             last_price: 3400000000000000,
//             last_ewma: 178367579,
//         };
//
//         assert_eq!(result.fees, expected.fees);
//         assert_eq!(result.amount_ex_fees, expected.amount_ex_fees);
//         assert_eq!(result.last_price, expected.last_price);
//         assert_eq!(result.last_ewma, expected.last_ewma);
//     }
//
//     // second time called, passing in previous values last_price, last_update and last_ewma
//     // which need to be stored on chain
//     {
//         let last_update = SystemTime::now()
//             .duration_since(UNIX_EPOCH)
//             .expect("seconds")
//             .as_secs()
//             .checked_sub(3600)
//             .unwrap();
//
//         let actual = compute_volatility_adjusted_fee(
//             3425_000000,
//             3400_000000,
//             6,
//             last_update,
//             178367579,
//             1000_000000,
//             6,
//         )
//         .unwrap();
//         let result = FeeResult::from(actual);
//         let expected = FeeResult {
//             fees: 3654334800000,
//             amount_ex_fees: 996345665200000,
//             last_update: 1649549126,
//             last_price: 3425000000000000,
//             last_ewma: 121810243,
//         };
//         assert_eq!(result.fees, expected.fees);
//         assert_eq!(result.amount_ex_fees, expected.amount_ex_fees);
//         assert_eq!(result.last_price, expected.last_price);
//         assert_eq!(result.last_ewma, expected.last_ewma);
//     }
// }
