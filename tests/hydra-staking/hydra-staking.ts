import * as anchor from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {BN, Program, web3} from '@project-serum/anchor';
import { HydraStaking } from '../../target/types/hydra_staking';
// import {createMint,  getMintInfo} from "@project-serum/common";
import { loadKey, createMintAndVault } from "../utils/utils"
import {Account} from "@solana/web3.js";
import {getMintInfo} from "@project-serum/common";

describe('hydra-staking',  () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());
  const program = anchor.workspace.HydraStaking as Program<HydraStaking>;

  let hydMint
  let hydVault

  it('should mint Hyd', async () => {
    hydMint = await loadKey("tests/keys/hyd3VthE9YPGBeg9HEgZsrM5qPniC6VoaEFeTGkVsJR.json")
    hydVault = web3.Keypair.generate();

    await createMintAndVault(program.provider, hydMint, hydVault, new BN(100_000_0000))
  });

  it('should initialized stake PDA vault', async () => {
    let [vaultPubkey, vaultBump] = await anchor.web3.PublicKey.findProgramAddress(
        [hydMint.publicKey.toBuffer()],
        program.programId
    )

    await program.rpc.initialize(
        vaultBump,
        {
            accounts: {
              tokenMint: hydMint.publicKey,
              tokenVault: vaultPubkey,
              initializer: program.provider.wallet.publicKey,
              systemProgram: anchor.web3.SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            }
          });
  });
});
