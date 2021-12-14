use std::{env, fs};
use std::path::Path;
use dotenv::dotenv;

fn main() {
    dotenv().ok();
    let pools_id    = env::var("HYDRA_POOLS").unwrap();
    let staking_id  = env::var("HYDRA_STAKING").unwrap();
    let farming_id  = env::var("HYDRA_FARMING").unwrap();
    let vesting_id  = env::var("HYDRA_VESTING").unwrap();
    let multisig    = env::var("HYDRA_MULTISIG").unwrap();

    let out_dir = env::var_os("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("program_ids.rs");

    fs::write(
        &dest_path,
            format!("
            const PROGRAM_ID_POOLS: Pubkey = static_pubkey!(\"{}\");
            const PROGRAM_ID_STAKING: Pubkey = static_pubkey!(\"{}\");
            const PROGRAM_ID_FARMING: Pubkey = static_pubkey!(\"{}\");
            const PROGRAM_ID_VESTING: Pubkey = static_pubkey!(\"{}\");
            const PROGRAM_ID_MULTISIG: Pubkey = static_pubkey!(\"{}\");
            ",pools_id,staking_id,farming_id,vesting_id,multisig)
    ).unwrap();
}