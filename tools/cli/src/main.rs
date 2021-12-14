mod farming;
mod pools;
mod staking;
mod utils;

use std::env;
use anchor_client::Cluster;
use anchor_client::solana_sdk::signature::Keypair;
use dotenv::dotenv;
use solana_program::pubkey::Pubkey;
use static_pubkey::static_pubkey;
use structopt::StructOpt;
use crate::farming::{FarmingSubCommand, execute_stake_lp_tokens_tx, execute_unstake_lp_tokens_tx};
use crate::pools::{PoolsSubCommand, execute_deposit_tx, execute_init_tx, execute_withdraw_tx, execute_swap_tx};
use crate::staking::{execute_stake_tokens_tx, StakingSubCommand};
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
    let keypair = load_keypair(DEFAULT_KEYPAIR)?;
    let cluster = Cluster::default();

    match exe.cmd {
        SubCommand::Pools { cmd } => {
            let connection = load_connection(hydra_pools::ID, keypair, cluster)?;
            match cmd {
                PoolsSubCommand::Init => {
                    execute_init_tx(&connection)?;
                }
                PoolsSubCommand::Deposit => {
                    execute_deposit_tx(&connection)?;
                }
                PoolsSubCommand::Withdraw => {
                    execute_withdraw_tx(&connection)?;
                }
                PoolsSubCommand::Swap => {
                    execute_swap_tx(&connection)?;
                }
            }
        },
        SubCommand::Farming { cmd } => {
            let connection = load_connection(hydra_farming::ID, keypair,cluster)?;
            match cmd {
                FarmingSubCommand::StakeLpTokens => {
                    execute_stake_lp_tokens_tx(&connection)?;
                }
                FarmingSubCommand::UnStakeLpTokens => {
                    execute_unstake_lp_tokens_tx(&connection)?;
                }
            }
        },
        SubCommand::Staking { cmd } => {
            let connection = load_connection(hydra_staking::ID, keypair,cluster)?;
            match cmd {
                StakingSubCommand::StakeTokens => {
                    execute_stake_tokens_tx(&connection)?;
                }
            }
        },
    }
    Ok(())
}
