mod farming;
mod pools;
mod staking;
mod utils;

use crate::farming::{execute_stake_lp_tokens_tx, execute_unstake_lp_tokens_tx};
use crate::pools::{execute_deposit_tx, execute_init_tx, execute_swap_tx, execute_withdraw_tx};
use crate::staking::execute_stake_tokens_tx;
use crate::utils::config::load_config;
use anchor_client::solana_client::rpc_client::RpcClient;
use anchor_client::solana_sdk::commitment_config::CommitmentConfig;
use anchor_client::solana_sdk::signature::{read_keypair_file, Keypair};

use clap::{crate_description, crate_name, crate_version, App, AppSettings, Arg, SubCommand};
use solana_clap_utils::input_validators::{is_keypair, is_url};

#[derive(Debug)]
pub struct Config {
    keypair: Keypair,
    json_rpc_url: String,
    verbose: bool,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let app_matches = App::new(crate_name!())
        .about(crate_description!())
        .version(crate_version!())
        .setting(AppSettings::SubcommandRequiredElseHelp)
        .arg({
            let arg = Arg::with_name("config_file")
                .short("c")
                .long("config")
                .value_name("PATH")
                .takes_value(true)
                .global(true)
                .help("Configuration file to use");
            if let Some(ref config_file) = *solana_cli_config::CONFIG_FILE {
                arg.default_value(config_file)
            } else {
                arg
            }
        })
        .arg(
            Arg::with_name("keypair")
                .long("keypair")
                .value_name("KEYPAIR")
                .validator(is_keypair)
                .takes_value(true)
                .global(true)
                .help("Filepath or url to a Keypair [default: client keypair]"),
        )
        .arg(
            Arg::with_name("verbose")
                .long("verbose")
                .short("v")
                .takes_value(false)
                .global(true)
                .help("Show additional information"),
        )
        .arg(
            Arg::with_name("json_rpc_url")
                .long("url")
                .value_name("URL")
                .takes_value(true)
                .global(true)
                .validator(is_url)
                .help("JSON RPC URL for the cluster [default: value from configuration file]"),
        )
        .subcommand(
            SubCommand::with_name("pools")
                .about("For working with the hydra-pools program")
                .subcommand(SubCommand::with_name("init").about("init a pool"))
                .subcommand(SubCommand::with_name("deposit").about("deposit into a pool"))
                .subcommand(SubCommand::with_name("withdraw").about("withdraw from a pool"))
                .setting(AppSettings::SubcommandRequiredElseHelp),
        )
        .subcommand(
            SubCommand::with_name("farming").about("For working with the hydra-farming program"),
        )
        .subcommand(
            SubCommand::with_name("staking").about("For working with the hydra-staking program"),
        )
        .get_matches();

    solana_logger::setup_with_default("solana=info");

    let (sub_command, sub_matches) = app_matches.subcommand();
    let matches = sub_matches.unwrap();
    let config = load_config(matches)?;

    let rpc_client =
        RpcClient::new_with_commitment(config.json_rpc_url.clone(), CommitmentConfig::confirmed());

    match (sub_command, sub_matches) {
        ("pools", Some(pool_matches)) => {
            let (sub_command, sub_matches) = pool_matches.subcommand();

            match (sub_command, sub_matches) {
                ("init", Some(init_matches)) => {
                    println!("init ... ");
                    execute_init_tx(rpc_client, config);
                }
                ("deposit", Some(deposit_matches)) => {
                    println!("deposit ...");
                }
                ("withdraw", Some(withdra_matches)) => {
                    println!("withdraw ...");
                }
                _ => unreachable!(),
            }
        }
        ("farming", Some(farming_matches)) => {}
        ("staking", Some(staking_matches)) => {}
        _ => unreachable!(),
    }
    Ok(())
}
