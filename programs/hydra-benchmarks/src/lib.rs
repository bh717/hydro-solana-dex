use anchor_lang::prelude::*;

declare_id!("HYS93RLjsDvKqAN9BFbUHG8L76E9Xtg8HarmGc6LSe5s");

#[program]
pub mod hydra_benchmarks {
    use super::*;
    pub fn initialize(_ctx: Context<Initialize>) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
