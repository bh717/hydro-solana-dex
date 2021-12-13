use structopt::StructOpt;

#[derive(Debug,StructOpt)]
pub enum FarmingSubCommand {
    StakeLpTokens,
    UnStakeLpTokens,
}

pub fn run_stake_lp_tokens(connection: &anchor_client::Program) -> anyhow::Result<()> {
    Ok(())
}


pub fn run_unstake_lp_tokens(connection: &anchor_client::Program) -> anyhow::Result<()> {
    Ok(())
}
