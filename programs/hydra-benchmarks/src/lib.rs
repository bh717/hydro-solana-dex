pub mod instructions;
pub mod state;

use instructions::*;

use anchor_lang::prelude::*;
use anchor_lang::solana_program::log::sol_log_compute_units;

declare_id!("HYSp5N2QA69XKtyWkgF1FzVM4DaiHuXyur52XedeT9Sn");

#[program]
pub mod hydra_bencmarks {
    use super::*;
    use hydra_math_rs::decimal::{Decimal, Ln};

    pub fn init_benchmark(ctx: Context<InitialiseBenchmark>, data: i64) -> ProgramResult {
        instructions::init_benchmark::handle(ctx, data)
    }

    pub fn initialize(ctx: Context<Initialize>, authority: Pubkey) -> ProgramResult {
        let benchmark = &mut ctx.accounts.benchmark_result;
        benchmark.authority = authority;
        Ok(())
    }

    pub fn ln_benchmark(_ctx: Context<Swap>) -> ProgramResult {
        let decimal = Decimal::new(10, 6, false);
        sol_log_compute_units();
        let ln_result = decimal.ln().unwrap();
        sol_log_compute_units();
        msg!("ln result is: {:?}", ln_result.to_u64());
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 512)]
    pub benchmark_result: Account<'info, BechmarkResult>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut, has_one = authority)]
    pub benchmark_result: Account<'info, BechmarkResult>,
    pub authority: Signer<'info>,
}

#[account]
pub struct BechmarkResult {
    pub authority: Pubkey,
    pub result: u64,
}
