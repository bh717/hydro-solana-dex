import * as anchor from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {Program, web3} from '@project-serum/anchor';
import { HydraStaking } from '../../target/types/hydra_staking';
// import {createMint,  getMintInfo} from "@project-serum/common";
import { loadKey, createMintAndVault } from "../utils/utils"
import {Account} from "@solana/web3.js";
import {getMintInfo} from "@project-serum/common";

describe('hydra-staking',  () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.HydraStaking as Program<HydraStaking>;

  it('Is initialized!', async () => {

    // load mint from key file
    let mint = await loadKey("tests/keys/hyd3VthE9YPGBeg9HEgZsrM5qPniC6VoaEFeTGkVsJR.json")
    let hydVault = web3.Keypair.generate();

    // @ts-ignore
    await createMintAndVault(provider, mint, hydVault, 100_000_0000)
    let [vaultPubkey, vaultBump] = await anchor.web3.PublicKey.findProgramAddress(
        [mint.publicKey.toBuffer()],
        program.programId
    )

    const tx = await program.rpc.initialize(
        vaultBump,
        {
            accounts: {
              tokenMint: mint.publicKey,
              tokenVault: vaultPubkey,
              initializer: provider.wallet.publicKey,
              systemProgram: anchor.web3.SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            }
          });
    console.log("Your transaction signature", tx);
  });
});
