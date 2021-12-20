use crate::Pubkey;
use anchor_lang::prelude::*;
use anchor_lang::{Context, Program, Signer, System};

use std::io::Write;

use crate::state::*;

#[derive(Accounts)]
pub struct InitialisePool<'info> {
    #[account(init, payer = user, space = 8 * 8) ]
    pub pool: Account<'info, Pool>,
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handle(ctx: Context<InitialisePool>, data: i64) -> ProgramResult {
    msg!("init_pool handle called");
    let pool = &mut ctx.accounts.pool;
    pool.data = data;
    Ok(())
}
