use spl_math::precise_number::PreciseNumber;
use wasm_bindgen::prelude::*;

/// deposit tokens into pool
// (amount * total_x_token.supply) / total_token_vault
#[wasm_bindgen]
pub fn calc_pool_tokens_for_deposit(
    amount: u64,
    total_token_vault: u64,
    total_redeemable_tokens: u64,
) -> u64 {
    let amount = PreciseNumber::new(amount as u128).unwrap();
    let total_token_vault = PreciseNumber::new(total_token_vault as u128).unwrap();
    let total_redeemable_tokens = PreciseNumber::new(total_redeemable_tokens as u128).unwrap();

    (amount)
        .checked_mul(&total_redeemable_tokens)
        .unwrap()
        .checked_div(&total_token_vault)
        .unwrap()
        .floor()
        .unwrap()
        .to_imprecise()
        .unwrap() as u64
}

/// withdraw tokens from pool
// (amount * total_tokens) / total_redeemable_token_supply
#[wasm_bindgen]
pub fn calc_pool_tokens_for_withdraw(
    amount: u64,
    total_tokens: u64,
    total_redeemable_token_supply: u64,
) -> u64 {
    let amount = PreciseNumber::new(amount as u128).unwrap();
    let total_tokens = PreciseNumber::new(total_tokens as u128).unwrap();
    let total_redeemable_token_supply =
        PreciseNumber::new(total_redeemable_token_supply as u128).unwrap();

    (amount)
        .checked_mul(&total_tokens)
        .unwrap()
        .checked_div(&total_redeemable_token_supply)
        .unwrap()
        .floor()
        .unwrap()
        .to_imprecise()
        .unwrap() as u64
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    #[test]
    fn deposit_token_specific_tests() {
        // With integer results
        let amount = 1_000u64;
        let total_redeemable_tokens = 100_000_000u64;
        let total_token_vault = 100_000_000u64;

        // (1000 * 100000000) / 100000000 = 1000
        let expected = 1000u64;

        let result =
            calc_pool_tokens_for_deposit(amount, total_token_vault, total_redeemable_tokens);
        assert_eq!(
            expected, result,
            "redeemable (1000 * 100000000) / 100000000 = ({} * {} / {})",
            amount, total_redeemable_tokens, total_token_vault
        );

        // Expect fractional component to be rounded down (floored)
        let amount = 987u64;
        let total_redeemable_tokens = 99_99_000u64;
        let total_token_vault = 100_000_000u64;

        // (987 * 9999000) / 100000000 = 98.69013000000 = 98
        let expected = 98u64;

        let result =
            calc_pool_tokens_for_deposit(amount, total_token_vault, total_redeemable_tokens);
        assert_eq!(
            expected, result,
            "redeemable (987 * 9999000) / 100000000 = ({} * {} / {})",
            amount, total_redeemable_tokens, total_token_vault
        );
    }

    #[test]
    fn withdraw_token_specific_tests() {
        // With integer results
        let amount = 1_000u64;
        let total_redeemable_tokens = 100_000_000u64;
        let total_token_vault = 100_000_000u64;

        // (1000 * 100000000) / 100000000 = 1000
        let expected = 1000u64;

        let result =
            calc_pool_tokens_for_withdraw(amount, total_token_vault, total_redeemable_tokens);
        assert_eq!(
            expected, result,
            "redeemable (1000 * 100000000) / 100000000 = ({} * {} / {})",
            amount, total_redeemable_tokens, total_token_vault
        );

        // Expect fractional component to be rounded down (floored)
        let amount = 987u64;
        let total_redeemable_tokens = 99_99_000u64;
        let total_token_vault = 100_000_000u64;

        // (987 * 100000000) / 9999000 = 9870.9870987099 = 9870
        let expected = 9870u64;

        let result =
            calc_pool_tokens_for_withdraw(amount, total_token_vault, total_redeemable_tokens);
        assert_eq!(
            expected, result,
            "redeemable (987 * 100000000) / 9999000 = ({} * {} / {})",
            amount, total_redeemable_tokens, total_token_vault
        );
    }

    pub struct StakePool {
        pub total_token_vault: u64,
        pub total_redeemable_tokens: u64,
    }

    prop_compose! {
        fn total_tokens_and_deposit()(total_token_vault in 1..u64::MAX)(
            total_token_vault in Just(total_token_vault),
            total_redeemable_tokens in 1..=total_token_vault,
            deposit_amount in 1..total_token_vault,
        ) -> (u64, u64, u64) {
            (
                total_token_vault - deposit_amount,
                total_redeemable_tokens.saturating_sub(deposit_amount).max(1),
                deposit_amount
            )
        }
    }

    proptest! {
        #[test]
        fn deposit_and_withdraw_token_range_tests(
            (total_token_vault, total_redeemable_tokens, deposit_amount) in total_tokens_and_deposit()
        ) {
            let mut stake_pool = StakePool {
                total_token_vault,
                total_redeemable_tokens,
            };
            let deposit_result = calc_pool_tokens_for_deposit(deposit_amount, total_token_vault, total_redeemable_tokens);
            prop_assume!(deposit_result > 0);
            stake_pool.total_token_vault += deposit_amount;
            stake_pool.total_redeemable_tokens += deposit_result;
            let withdraw_result = calc_pool_tokens_for_withdraw(deposit_result, total_token_vault, total_redeemable_tokens);
            assert!(withdraw_result <= deposit_amount);
        }
    }
}
