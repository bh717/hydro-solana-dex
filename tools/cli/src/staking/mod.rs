use structopt::StructOpt;

#[derive(Debug,StructOpt)]
pub enum StakingSubCommand {
    StakeTokens
}

pub fn execute_stake_tokens_tx(connection: &anchor_client::Program) -> anyhow::Result<()> {
    Ok(())
}
