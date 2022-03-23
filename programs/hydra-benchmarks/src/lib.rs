use anchor_lang::prelude::*;
use hydra_math_rs::decimal::Decimal;
use hydra_math_rs::programs::liquidity_pools::swap_calculator::SwapCalculator;

declare_id!("HYS93RLjsDvKqAN9BFbUHG8L76E9Xtg8HarmGc6LSe5s");

#[program]
pub mod hydra_benchmarks {
    use super::*;
    use anchor_lang::solana_program::log::sol_log_compute_units;
    use hydra_math_rs::decimal::{Decimal, Ln, Sqrt};
    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        sol_log_compute_units();
        let value = Decimal::from_u64(10).to_scale(12);
        msg!("Decimal::new = {:?}", value);
        sol_log_compute_units();
        let ln_value = value.ln().unwrap();
        msg!("ln(10) = {:?}", ln_value);
        sol_log_compute_units();
        let sqrt = value.sqrt().unwrap();
        msg!("sqrt(10) = {:?}", sqrt);
        sol_log_compute_units();
        let swap = SwapCalculator::new(
            Decimal::from_scaled_amount(37_000000, 6),
            Decimal::from_scaled_amount(126_000000, 6),
            Decimal::from_scaled_amount(1_000000, 6),
            Decimal::from_scaled_amount(3_000000, 6),
            Decimal::from_scaled_amount(0, 6),
        );
        let delta_x = Decimal::from_scaled_amount(3_000000, 6);
        let swap_x_to_y_hmm = swap.swap_x_to_y_hmm(&delta_x);
        msg!("swap_x_to_y_hmm = {:?}", swap_x_to_y_hmm);
        sol_log_compute_units();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
