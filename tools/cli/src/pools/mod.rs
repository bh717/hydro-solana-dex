use structopt::StructOpt;

#[derive(Debug,StructOpt)]
pub enum PoolsSubCommand {
    Init,
    Deposit,
    Withdraw,
    Swap,
}

pub fn execute_init_tx(connection: &anchor_client::Program) -> anyhow::Result<()> {
    println!("running init: {:?}", connection);
    Ok(())
}

pub fn execute_deposit_tx(connection: &anchor_client::Program) -> anyhow::Result<()> {
    Ok(())
}

pub fn execute_withdraw_tx(connection: &anchor_client::Program) -> anyhow::Result<()> {
    Ok(())
}

pub fn execute_swap_tx(connection: &anchor_client::Program) -> anyhow::Result<()> {
    Ok(())
}
