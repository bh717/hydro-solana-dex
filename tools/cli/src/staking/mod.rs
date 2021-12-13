use structopt::StructOpt;

#[derive(Debug,StructOpt)]
pub enum StakingSubCommand {
    StakeTokens
}

pub fn run_stake_tokens(connection: &anchor_client::Program) -> anyhow::Result<()> {
    Ok(())
}
