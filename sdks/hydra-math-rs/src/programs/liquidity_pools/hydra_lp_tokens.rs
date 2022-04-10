use crate::decimal::{Decimal, DivUp, Mul, Sqrt, Sub};

pub const MIN_LIQUIDITY: u64 = 100;
pub const LIQUIDITY_POOL_SCALE: u8 = 6;

pub fn calculate_k(x: u64, x_scale: u8, y: u64, y_scale: u8) -> Option<u64> {
    let x = Decimal::from_scaled_amount(x, x_scale).to_compute_scale();
    let y = Decimal::from_scaled_amount(y, y_scale).to_compute_scale();
    let min_liquidity = Decimal::from_u64(MIN_LIQUIDITY).to_compute_scale();

    // sqrt(x * y) - min_liquidity
    Some(
        x.mul(y)
            .sqrt()
            .unwrap()
            .sub(min_liquidity)
            .unwrap()
            .to_scaled_amount(LIQUIDITY_POOL_SCALE),
    )
}

/// calculate a and b tokens (x/y) from lp_tokens (k)
pub fn calculate_x_y(
    lp_tokens: u64,
    tokens_a_total: u64,
    tokens_b_total: u64,
    lp_tokens_total: u64,
) -> (u64, u64) {
    let x_total = Decimal::from_u64(tokens_a_total);
    let y_total = Decimal::from_u64(tokens_b_total);
    let lp_total = Decimal::from_u64(lp_tokens_total);
    let lp_tokens_to_mint = Decimal::from_u64(lp_tokens);

    // div up (ceiling) as we are receiving these amounts
    let x_debited = lp_tokens_to_mint.mul(x_total).div_up(lp_total).to_u64();
    let y_debited = lp_tokens_to_mint.mul(y_total).div_up(lp_total).to_u64();

    (x_debited, y_debited)
}

#[cfg(test)]
mod test {
    use super::*;
    #[test]
    fn test_calculate_k() {
        {
            // Same scale
            // (600.000000 * 20.000000)**0.5 - 100 = 9.544511
            let expected: u64 = 9_544511;
            let result = calculate_k(600_000000, 6, 20_000000, 6).unwrap();
            assert_eq!(expected, result);
        }

        {
            // Different scale
            // (600.000000 * 20.000000000)**0.5 - 100 = 9.544511
            let expected: u64 = 9_544511;
            let result = calculate_k(600_000000, 6, 20_000000000, 9).unwrap();
            assert_eq!(expected, result);
        }

        {
            // Different scale
            // (600.000000000 * 20.000000)**0.5 - 100 = 9.544511501
            let expected: u64 = 9_544511;
            let result = calculate_k(600_000000, 9, 20_000000000, 6).unwrap();
            assert_eq!(expected, result);
        }
    }
}
