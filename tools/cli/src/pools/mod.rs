use anchor_client::solana_client::rpc_client::RpcClient;
use anchor_client::solana_sdk::instruction::Instruction;
use anchor_client::solana_sdk::signature::{Keypair, Signature};
use anchor_client::solana_sdk::signer::Signer;
use anchor_client::solana_sdk::transaction::Transaction;
use anchor_lang::prelude::*;
use solana_program::system_program;

use crate::Config;
use hydra_pools::state::Pool;

pub fn execute_init_tx<'a>(rpc_client: RpcClient, config: Config) -> anyhow::Result<()> {
    println!("running init");
    let program_id = hydra_pools::ID;
    let pool = Keypair::new();

    println!("program_id: {}", program_id);

    let ix = Instruction {
        program_id: program_id,
        accounts: hydra_pools::accounts::InitialisePool {}.to_account_metas(None),
        data: hydra_pools::instruction::InitPool {}.try_to_vec()?,
    };

    println!("config: {:?}", config);

    let mut transaction = Transaction::new_with_payer(&[ix], Some(&config.keypair.pubkey()));
    let blockhash = rpc_client.get_latest_blockhash()?;
    transaction.try_sign(&[&config.keypair, &pool], blockhash);

    println!("JSON RPC URL: {}", config.json_rpc_url);

    let sig = rpc_client
        .send_and_confirm_transaction(&transaction)
        .unwrap();
    println!("txhash: {}", sig);

    Ok(())
}

pub fn execute_deposit_tx(program: &anchor_client::Program) -> anyhow::Result<()> {
    Ok(())
}

pub fn execute_withdraw_tx(program: &anchor_client::Program) -> anyhow::Result<()> {
    Ok(())
}

pub fn execute_swap_tx(program: &anchor_client::Program) -> anyhow::Result<()> {
    Ok(())
}
