mod farming;
mod pools;
mod staking;
mod utils;

use crate::farming::{execute_stake_lp_tokens_tx, execute_unstake_lp_tokens_tx, FarmingSubCommand};
use crate::pools::{
    execute_deposit_tx, execute_init_tx, execute_swap_tx, execute_withdraw_tx, PoolsSubCommand,
};
use crate::staking::{execute_stake_tokens_tx, StakingSubCommand};
use crate::utils::{load_connection, load_keypair};
use anchor_client::solana_sdk::signature::Keypair;
use anchor_client::Cluster;
use dotenv::dotenv;
use solana_program::pubkey::Pubkey;
use static_pubkey::static_pubkey;
use std::env;
use std::path::PathBuf;
use structopt::StructOpt;
use strum::VariantNames;
use strum_macros::EnumString;
use strum_macros::EnumVariantNames;

const DEFAULT_KEYPAIR: &str = "~/.config/solana/id.json";

#[derive(Debug, StructOpt)]
pub struct Opt {
    #[structopt(short = "m", long, case_insensitive = true,possible_values = Moniker::VARIANTS, default_value = DEFAULT_MONIKER)]
    moniker: Moniker,

    #[structopt(short = "k", long, parse(from_os_str))]
    keypair: PathBuf,

    #[structopt(subcommand)]
    pub cmd: SubCommand,
}

const DEFAULT_MONIKER: &str = "localhost";

#[derive(EnumString, EnumVariantNames, Debug)]
#[strum(serialize_all = "kebab_case")]
pub enum Moniker {
    Localhost,
    Devnet,
    Testnet,
    Mainnet,
}

#[derive(Debug, StructOpt)]
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
    },
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
        }
        SubCommand::Farming { cmd } => {
            let connection = load_connection(hydra_farming::ID, keypair, cluster)?;
            match cmd {
                FarmingSubCommand::StakeLpTokens => {
                    execute_stake_lp_tokens_tx(&connection)?;
                }
                FarmingSubCommand::UnStakeLpTokens => {
                    execute_unstake_lp_tokens_tx(&connection)?;
                }
            }
        }
        SubCommand::Staking { cmd } => {
            let connection = load_connection(hydra_staking::ID, keypair, cluster)?;
            match cmd {
                StakingSubCommand::StakeTokens => {
                    execute_stake_tokens_tx(&connection)?;
                }
            }
        }
    }
    Ok(())
}
