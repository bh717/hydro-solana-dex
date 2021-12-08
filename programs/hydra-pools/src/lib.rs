use anchor_lang::prelude::*;

declare_id!("GZEvUuDxVfqs7WobzZgyg7YiWkXccPdUQjeku4A7bzLz");

#[program]
pub mod hydra_pools {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
