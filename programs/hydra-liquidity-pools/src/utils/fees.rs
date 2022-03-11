use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Default, Clone, Debug)]
pub struct Fees {
    pub trade_fee_numerator: u64,
    /// Trade fee denominator
    pub trade_fee_denominator: u64,
}

pub fn calculate_fee(
    token_amount: u128,
    fee_numerator: u128,
    fee_denominator: u128,
) -> Option<u128> {
    if fee_numerator == 0 || fee_denominator == 0 {
        return Some(0);
    }

    let fee = token_amount
        .checked_mul(fee_numerator)?
        .checked_div(fee_denominator)?;

    Some(fee)
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_calculate_fee_0n_0d() {
        let expected = 0;
        let result = calculate_fee(1_000_000, 0, 0).unwrap();
        assert_eq!(expected, result)
    }

    #[test]
    fn test_calculate_fee_1n_0d() {
        let expected = 0;
        let result = calculate_fee(1_000_000, 1, 0).unwrap();
        assert_eq!(expected, result)
    }

    #[test]
    fn test_calculate_fee_1n_2d() {
        let expected = 500_000;
        let result = calculate_fee(1_000_000, 1, 2).unwrap();
        assert_eq!(expected, result)
    }

    #[test]
    fn test_calculate_1n_1000d() {
        let expected = 100;
        let result = calculate_fee(1_000_000, 1, 10_000).unwrap();
        assert_eq!(expected, result)
    }

    #[test]
    fn test_calculate_1n_10000d() {
        let expected = 10;
        let result = calculate_fee(1_000_000, 1, 100_000).unwrap();
        assert_eq!(expected, result)
    }
}
