use crate::Pubkey;
use anchor_lang::prelude::*;
use anchor_lang::{Context, Program, Signer, System};

use std::io::Write;

use crate::state::*;

#[derive(Accounts)]
pub struct InitialisePool<'info> {
    #[account(zero)]
    pub pool: AccountLoader<'info, Pool>,
}

pub fn handle(
    ctx: Context<InitialisePool>,
    owner: Pubkey,
    quote_currency: String,
    quote_token_mint: Pubkey,
) -> ProgramResult {
    let pool_address = ctx.accounts.pool.key();
    let initial_seeds = &[ctx.accounts.pool.to_account_info().key.as_ref()];

    let mut pool = ctx.accounts.pool.load_init()?;

    let (authority, authority_seed) = Pubkey::find_program_address(initial_seeds, ctx.program_id);

    pool.version = 0;
    pool.owner = owner;
    pool.pool_authority = authority;
    pool.authority_seed = pool_address;
    pool.authority_bump_seed = [authority_seed];
    pool.quote_token_mint = quote_token_mint;
    (&mut pool.quote_currency[..]).write_all(quote_currency.as_bytes())?;

    msg!("Pool initialised with {}", quote_currency);

    Ok(())
}
