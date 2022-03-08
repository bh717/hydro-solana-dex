use crate::decimal::{Decimal, DivUp, Mul, Sqrt, Sub};

pub const MIN_LIQUIDITY: u64 = 100;

pub fn calculate_k(token_a_amount: u64, token_b_amount: u64, lp_total: u64) -> Option<u64> {
    if lp_total == 0 {
        let x = token_a_amount;
        let y = token_b_amount;

        let x = Decimal::from_u64(x);
        let y = Decimal::from_u64(y);
        let min_liquidity = Decimal::from_u64(MIN_LIQUIDITY);

        // sqrt(x * y) - min_liquidity
        return Some(
            x.mul(y)
                .sqrt()
                .unwrap()
                .sub(min_liquidity)
                .unwrap()
                .to_u64(),
        );
    }
    None
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