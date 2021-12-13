use structopt::StructOpt;

#[derive(Debug,StructOpt)]
pub enum PoolsSubCommand {
    Init,
    Deposit,
    Withdraw,
    Swap,
}

pub fn run_init(connection: &anchor_client::Program) -> anyhow::Result<()> {
    println!("running init");
    Ok(())
}

pub fn run_deposit(connection: &anchor_client::Program) -> anyhow::Result<()> {
    Ok(())
}

pub fn run_withdraw(connection: &anchor_client::Program) -> anyhow::Result<()> {
    Ok(())
}

pub fn run_swap(connection: &anchor_client::Program) -> anyhow::Result<()> {
    Ok(())
}
