use anchor_lang::prelude::*;

declare_id!("9fKWriR43ZH5ZrPyi7Cj5nDKDN4DEyZjgUYmigAS7Rzr");

#[program]
pub mod hydra_farming {
    use super::*;
    pub fn initialize(_ctx: Context<Initialize>) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
