use anchor_lang::prelude::*;

declare_id!("26Z7yPwdJjU8a15GVBW2MBhPGjERhQPC5z7xTtiQMpe1");

#[program]
pub mod hydra_farming {
    use super::*;
    pub fn initialize(_ctx: Context<Initialize>) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
