use structopt::StructOpt;

#[derive(Debug, StructOpt)]
pub enum FarmingSubCommand {
    StakeLpTokens,
    UnStakeLpTokens,
}

pub fn execute_stake_lp_tokens_tx(connection: &anchor_client::Program) -> anyhow::Result<()> {
    Ok(())
}

pub fn execute_unstake_lp_tokens_tx(connection: &anchor_client::Program) -> anyhow::Result<()> {
    Ok(())
}
