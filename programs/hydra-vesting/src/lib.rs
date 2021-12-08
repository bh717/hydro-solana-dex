use anchor_lang::prelude::*;

declare_id!("HkG8sHwqFaTVsdMsNnvYK7j2sF5c8h7nNX8zV2ySBDe6");

#[program]
pub mod hydra_vesting {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
