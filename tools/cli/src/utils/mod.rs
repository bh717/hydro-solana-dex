use anchor_client::solana_sdk::pubkey::Pubkey;
use anchor_client::solana_sdk::signature::Keypair;
use anchor_client::Cluster;

pub fn load_keypair(private_keypair_path: &str) -> anyhow::Result<Keypair> {
    let keypair_path = shellexpand::tilde(private_keypair_path);
    let keypair_data = std::fs::read_to_string(keypair_path.to_string())?;
    let keypair_bytes: Vec<u8> = serde_json::from_str(&keypair_data)?;
    let keypair = Keypair::from_bytes(&keypair_bytes)?;
    Ok(keypair)
}

pub fn load_program(
    program_id: Pubkey,
    keypair: Keypair,
    cluster: Cluster,
) -> anyhow::Result<anchor_client::Program> {
    let client = anchor_client::Client::new(cluster, keypair);
    Ok(client.program(program_id))
}
