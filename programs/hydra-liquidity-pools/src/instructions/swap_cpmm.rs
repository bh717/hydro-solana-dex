use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SwapCpmm<'info> {
    pub user: Signer<'info>,
}

pub fn handle(ctx: Context<SwapCpmm>) -> ProgramResult {
    Ok(())
}
