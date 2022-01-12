use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitialisePool<'info> {
    #[account(init, payer = user, space = 8 * 8) ]
    pub pool: Account<'info, Pool>,
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handle(ctx: Context<InitialisePool>, num: i64) -> ProgramResult {
    let pool = &mut ctx.accounts.pool;
    pool.num = num;
    msg!("data: {}", pool.num);
    Ok(())
}
