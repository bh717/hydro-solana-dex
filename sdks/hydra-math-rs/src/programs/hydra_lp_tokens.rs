use crate::math::sqrt_precise;
use spl_math::precise_number::PreciseNumber;

pub const MIN_LIQUIDITY: u64 = 100;

pub fn calculate_k(
    token_a_amount: u64,
    token_b_amount: u64,
    token_a_vault_total: u64,
    token_b_vault_total: u64,
    lp_total: u64,
) -> Option<u64> {
    if lp_total == 0 {
        let x = token_a_amount;
        let y = token_b_amount;
        let x_total = token_a_vault_total;
        let y_total = token_b_vault_total;

        let x = PreciseNumber::new(x as u128).unwrap();
        let y = PreciseNumber::new(y as u128).unwrap();
        let min_liquidity = PreciseNumber::new(MIN_LIQUIDITY as u128).unwrap();

        // sqrt(x * y) - min_liquidity
        return Some(
            sqrt_precise(&x.checked_mul(&y).unwrap())
                .unwrap()
                .checked_sub(&min_liquidity)
                .unwrap()
                .floor()
                .unwrap()
                .to_imprecise()
                .unwrap() as u64,
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
    let x_total = PreciseNumber::new(tokens_a_total as u128).unwrap();
    let y_total = PreciseNumber::new(tokens_b_total as u128).unwrap();
    let lp_total = PreciseNumber::new(lp_tokens_total as u128).unwrap();
    let lp_tokens_to_mint = PreciseNumber::new(lp_tokens as u128).unwrap();

    // lp_tokens  * x_total
    let x_debited = lp_tokens_to_mint
        .checked_mul(&x_total)
        .unwrap()
        .checked_div(&lp_total)
        .unwrap()
        .ceiling()
        .unwrap();
    let x_debited = x_debited.to_imprecise().unwrap() as u64;

    let y_debited = lp_tokens_to_mint
        .checked_mul(&y_total)
        .unwrap()
        .checked_div(&lp_total)
        .unwrap()
        .ceiling()
        .unwrap();
    let y_debited = y_debited.to_imprecise().unwrap() as u64;

    //* note that we rounded up with .ceiling() (as we are receiving these amounts)
    (x_debited, y_debited)
}
