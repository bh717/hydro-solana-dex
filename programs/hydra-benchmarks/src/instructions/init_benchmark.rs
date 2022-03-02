use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitialiseBenchmark<'info> {
    #[account(init, payer = user, space = 8 * 8) ]
    pub benchmark: Account<'info, Benchmark>,
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handle(ctx: Context<InitialiseBenchmark>, num: i64) -> ProgramResult {
    let benchmark = &mut ctx.accounts.benchmark;
    benchmark.num = num;
    msg!("data: {}", benchmark.num);
    Ok(())
}
