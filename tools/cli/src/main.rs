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

// Programs ids (hack) that get imported via a dotenv setup. See build.rs
include!(concat!(env!("OUT_DIR"), "/program_ids.rs"));

fn main() -> anyhow::Result<()> {
    let exe = Opt::from_args();
    let keypair = load_keypair(DEFAULT_KEYPAIR)?;
    let cluster = Cluster::default();

    match exe.cmd {
        SubCommand::Pools { cmd } => {
            let connection = load_connection(PROGRAM_ID_POOLS, keypair, cluster)?;
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
            let connection = load_connection(PROGRAM_ID_FARMING, keypair,cluster)?;
            match cmd {
                FarmingSubCommand::StakeLpTokens => {
                    run_stake_lp_tokens(&connection)?;
                }
                FarmingSubCommand::UnStakeLpTokens => {
                    run_unstake_lp_tokens(&connection)?;
                }
            }
        },
        SubCommand::Staking { cmd } => {
            let connection = load_connection(PROGRAM_ID_STAKING, keypair,cluster)?;
            match cmd {
                StakingSubCommand::StakeTokens => {
                    run_stake_tokens(&connection)?;
                }
            }
        },
    }
    Ok(())
}
