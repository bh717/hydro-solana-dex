use anchor_lang::prelude::*;

declare_id!("CEHs5pSDff4RHjPqMJZAkYqaLSaeX9BfY5iyyH6PmKf7");

#[program]
pub mod hydra_staking {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
