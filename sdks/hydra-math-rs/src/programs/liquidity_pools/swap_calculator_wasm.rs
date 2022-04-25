use crate::decimal::Decimal;
use crate::programs::liquidity_pools::swap_calculator::SwapCalculatorBuilder;
use wasm_bindgen::prelude::wasm_bindgen;

/// Interface to be used by programs and front end
/// these functions shadow functions of the implemented swap calculator
#[wasm_bindgen]
pub fn swap_x_to_y_hmm(
    x0: u64,
    x_scale: u8,
    y0: u64,
    y_scale: u8,
    c: u8,
    i: u64,
    i_scale: u8,
    fee_numer: u64,
    fee_denom: u64,
    amount: u64,
) -> Result<Vec<u64>, String> {
    let calculator = SwapCalculatorBuilder::default()
        .x0(x0, x_scale)
        .y0(y0, y_scale)
        .c(c)
        .i(i, i_scale)
        .percentage_fee_numerator(fee_numer)
        .percentage_fee_denominator(fee_denom)
        .scale(x_scale, y_scale)
        .build()
        .unwrap();

    let delta_x = Decimal::from_scaled_amount(amount, x_scale).to_compute_scale();

    let result = calculator
        .swap_x_to_y_hmm(&delta_x)
        .expect("failed to swap x to y");

    Ok(result.into())
}

#[wasm_bindgen]
pub fn swap_y_to_x_hmm(
    x0: u64,
    x_scale: u8,
    y0: u64,
    y_scale: u8,
    c: u8,
    i: u64,
    i_scale: u8,
    fee_numer: u64,
    fee_denom: u64,
    amount: u64,
) -> Result<Vec<u64>, String> {
    let calculator = SwapCalculatorBuilder::default()
        .x0(x0, x_scale)
        .y0(y0, y_scale)
        .c(c)
        .i(i, i_scale)
        .percentage_fee_numerator(fee_numer)
        .percentage_fee_denominator(fee_denom)
        .scale(x_scale, y_scale)
        .build()
        .unwrap();

    let delta_y = Decimal::from_scaled_amount(amount, y_scale).to_compute_scale();

    let result = calculator
        .swap_y_to_x_hmm(&delta_y)
        .expect("failed to swap y to x");

    Ok(result.into())
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use crate::programs::liquidity_pools::swap_result::SwapResult;

    use super::*;

    #[test]
    fn test_scalar_inputs() {
        // x to y (given delta X what is delta Y?)
        {
            let actual = swap_x_to_y_hmm(
                1000000_000000000, // 1 million x tokens
                9,
                1000000_000000, // 1 million y tokens
                6,
                0,
                0,
                0,
                1,
                500,
                9_979900400, // just under 10 X tokens
            )
            .unwrap();
            let expected = 99_59841;
            let result = SwapResult::from(actual);
            assert_eq!(result.delta_y, expected);
        }

        {
            let actual: SwapResult = From::from(
                swap_x_to_y_hmm(
                    37_000000, 6, 126_000000, 6, 100, 3_000000, 6, 0, 0, 3_000000,
                )
                .unwrap(),
            );
            let expected = 9_207_401u64;
            assert_eq!(actual.delta_y, expected);
        }

        // y to x (given delta Y what is delta X?)
        {
            let actual: SwapResult = From::from(
                swap_y_to_x_hmm(
                    37_000000, 6, 126_000000, 6, 100, 3_000000, 6, 0, 0, 3_000000,
                )
                .unwrap(),
            );
            let expected = 860_465u64;
            assert_eq!(actual.delta_x, expected);
        }
    }
}
