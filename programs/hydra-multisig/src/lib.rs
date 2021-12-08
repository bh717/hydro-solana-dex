use anchor_lang::prelude::*;

declare_id!("s4AwM6iFTSSCnfGkYfwV4GpXYWW6CSxdoErTmDZ7HWq");

#[program]
pub mod hydra_multisig {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
