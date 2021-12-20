use crate::{read_keypair_file, Config};
use clap::{
    crate_description, crate_name, crate_version, App, AppSettings, Arg, ArgMatches, SubCommand,
};
use solana_clap_utils::input_validators::{is_keypair, is_url};

pub fn load_config(matches: &ArgMatches) -> Result<(Config), Box<dyn std::error::Error>> {
    let cli_config = if let Some(config_file) = matches.value_of("config_file") {
        solana_cli_config::Config::load(config_file).unwrap_or_default()
    } else {
        solana_cli_config::Config::default()
    };

    Ok(Config {
        json_rpc_url: matches
            .value_of("json_rpc_url")
            .unwrap_or(&cli_config.json_rpc_url)
            .to_string(),
        keypair: read_keypair_file(
            matches
                .value_of("keypair")
                .unwrap_or(&cli_config.keypair_path),
        )?,
        verbose: matches.is_present("verbose"),
    })
}
