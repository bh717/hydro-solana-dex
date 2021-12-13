use anchor_client::Cluster;
use anchor_client::solana_sdk::signature::Keypair;
use anchor_lang::prelude::Pubkey;
use structopt::StructOpt;

const default_keypair: &str = "~/.config/solana/id.json";

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

#[derive(Debug,StructOpt)]
pub enum PoolsSubCommand {
    Init,
    Deposit,
    Withdraw,
    Swap,
}

#[derive(Debug,StructOpt)]
pub enum FarmingSubCommand {
    StakeLpTokens,
    UnStakeLpTokens,
}

#[derive(Debug,StructOpt)]
pub enum StakingSubCommand {
    StakeTokens
}

fn main() -> anyhow::Result<()> {
    let exe = Opt::from_args();
    println!("output: {:?}",exe);

    match exe.cmd {
        SubCommand::Pools { cmd } => {
            println!("run pool cmds: {:?}", cmd)
        },
        SubCommand::Farming { cmd } => {
            println!("run farming cmds: {:?}", cmd)
        },
        SubCommand::Staking { cmd } => {
            println!("run staking cmds: {:?}", cmd)
        },
        _ => {
            println!("other cmd: {:?}", exe.cmd)
        }
    }
    Ok(())
}

fn load_keypair(private_keypair_path: &str) -> anyhow::Result<Keypair>{
    let keypair_path = shellexpand::tilde(private_keypair_path);
    let keypair_data = std::fs::read_to_string(keypair_path.to_string())?;
    let keypair_bytes: Vec<u8> = serde_json::from_str(&keypair_data)?;
    let keypair = Keypair::from_bytes(&keypair_bytes)?;
    Ok(keypair)
}

fn load_client(programId: Pubkey,keypair: Keypair, cluster: Cluster) -> anyhow::Result<anchor_client::Program> {
    let connection = anchor_client::Client::new(cluster,keypair);
    let client = connection.program(programId);
    Ok(client)
}
