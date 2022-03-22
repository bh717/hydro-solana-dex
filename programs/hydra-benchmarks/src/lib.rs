use anchor_lang::prelude::*;

declare_id!("HYS93RLjsDvKqAN9BFbUHG8L76E9Xtg8HarmGc6LSe5s");

#[program]
pub mod hydra_benchmarks {
    use super::*;
    use anchor_lang::solana_program::log::sol_log_compute_units;
    use hydra_math_rs::decimal::{Decimal, Sqrt};
    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        sol_log_compute_units();
        let value = Decimal::from_u64(10).to_scale(12);
        msg!("Decimal::new = {:?}", value);
        sol_log_compute_units();
        // TODO: This code is breaking within the instruction execution.
        // let ln_value = value.ln().unwrap();
        // msg!("ln(10) = {:?}", ln_value);
        // sol_log_compute_units();
        let sqrt = value.sqrt().unwrap();
        msg!("sqrt(10) = {:?}", sqrt);
        sol_log_compute_units();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
