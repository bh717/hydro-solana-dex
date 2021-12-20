use crate::state::*;
use anchor_lang::prelude::*;
use anchor_lang::{Context, Program, Signer, System};

#[derive(Accounts)]
pub struct InitialisePool<'info> {
    #[account(init, payer = user, space = 8 * 8) ]
    pub pool: Account<'info, Pool>,
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handle(ctx: Context<InitialisePool>, data: i64) -> ProgramResult {
    let pool = &mut ctx.accounts.pool;
    pool.data = data;
    Ok(())
}
