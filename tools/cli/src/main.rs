mod farming;
mod pools;
mod staking;
mod utils;

use anchor_client::Cluster;
use structopt::StructOpt;
use crate::farming::{FarmingSubCommand, run_stake_lp_tokens, run_unstake_lp_tokens};
use crate::pools::{PoolsSubCommand, run_deposit, run_init, run_swap, run_withdraw};
use crate::staking::{run_stake_tokens, StakingSubCommand};
use crate::utils::{load_connection, load_keypair};

const DEFAULT_KEYPAIR: &str = "~/.config/solana/id.json";

#[derive(Debug, StructOpt)]
pub struct Opt {
    #[structopt(subcommand)]
    pub cmd: SubCommand,
}

#[derive(Debug,StructOpt)]
pub enum SubCommand {
    Pools {
        #[structopt(subcommand)]
        cmd: PoolsSubCommand,
    },
    Farming {
        #[structopt(subcommand)]
        cmd: FarmingSubCommand,
    },
    Staking {
        #[structopt(subcommand)]
        cmd: StakingSubCommand,
    }
}


fn main() -> anyhow::Result<()> {
    let exe = Opt::from_args();
    println!("output: {:?}",exe);
    let keypair = load_keypair(DEFAULT_KEYPAIR)?;
    let cluster = Cluster::default();

    let program_id = match exe.cmd {
        SubCommand::Pools { .. } => hydra_pools::ID,
        SubCommand::Farming { .. } => hydra_farming::ID,
        SubCommand::Staking { .. } => hydra_staking::ID,
    };

    match exe.cmd {
        SubCommand::Pools { cmd } => {
            println!("run pool cmds: {:?}", cmd);

            let connection = load_connection(program_id, keypair, cluster)?;
            match cmd {
                PoolsSubCommand::Init => {
                    run_init(&connection)?;
                }
                PoolsSubCommand::Deposit => {
                    run_deposit(&connection)?;
                }
                PoolsSubCommand::Withdraw => {
                    run_withdraw(&connection)?;
                }
                PoolsSubCommand::Swap => {
                    run_swap(&connection)?;
                }
            }
        },
        SubCommand::Farming { cmd } => {
            println!("run farming cmds: {:?}", cmd);

            // let connection = load_connection(hydra_farming::ID, keypair,cluster)?;
            match cmd {
                FarmingSubCommand::StakeLpTokens => {
                    // run_stake_lp_tokens(&connection)?;
                }
                FarmingSubCommand::UnStakeLpTokens => {
                    // run_unstake_lp_tokens(&connection)?;
                }
            }
        },
        SubCommand::Staking { cmd } => {
            println!("run staking cmds: {:?}", cmd);

            // let connection = load_connection(hydra_staking::ID, keypair,cluster)?;
            match cmd {
                StakingSubCommand::StakeTokens => {
                    // run_stake_tokens(&connection)?;
                }
            }
        },
    }
    Ok(())
}
