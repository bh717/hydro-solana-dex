// This is not run with anchor migrate
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import * as localJsonIdl from "target/idl/hydra_staking.json";
import { HydraStaking, IDL } from "types-ts/codegen/types/hydra_staking";
import { loadKey, createMintAndVault, createMint } from "hydra-ts/node"; // these should be moved out of test
import { TokenInstructions } from "@project-serum/serum";
import { Keypair } from "@solana/web3.js";
import { NodeWallet } from "@project-serum/common";

const utf8 = anchor.utils.bytes.utf8;

export default async function (provider: anchor.Provider) {
  anchor.setProvider(provider);

  // Add your deploy script here.
  const hydraStaking = new anchor.web3.PublicKey(
    localJsonIdl["metadata"]["address"]
  );
  const program = new anchor.Program(
    IDL,
    hydraStaking
  ) as Program<HydraStaking>;

  let TokenAccount = Keypair.generate();

  const tokenMint = await loadKey(
    "keys/localnet/staking/hyd3VthE9YPGBeg9HEgZsrM5qPniC6VoaEFeTGkVsJR.json"
  );
  const redeemableMint = await loadKey(
    "keys/localnet/staking/xhy1rv75cEJahTbsKnv2TpNhdR7KNUoDPavKuQDwhDU.json"
  );

  console.log("Creating mint and vault...");
  await createMintAndVault(
    program.provider,
    tokenMint,
    TokenAccount,
    new anchor.BN(100_000_000)
  );

  const [tokenVaultPubkey, tokenVaultBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [
        utf8.encode("token_vault_seed"),
        tokenMint.publicKey.toBuffer(),
        redeemableMint.publicKey.toBuffer(),
      ],
      program.programId
    );

  console.log("Creating mint...");
  await createMint(program.provider, redeemableMint, tokenVaultPubkey);

  const [poolStatePubkey, poolStateBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [
        utf8.encode("pool_state_seed"),
        tokenMint.publicKey.toBuffer(),
        redeemableMint.publicKey.toBuffer(),
      ],
      program.programId
    );

  console.log("Initializing...");
  console.log(`poolStatePubkey:\t${poolStatePubkey}
tokenVaultPubkey:\t${tokenVaultPubkey}
tokenMint:\t\t${tokenMint.publicKey}
redeemableMint:\t\t${redeemableMint.publicKey}
`);
  await program.rpc.initialize(tokenVaultBump, poolStateBump, {
    accounts: {
      authority: program.provider.wallet.publicKey,
      tokenMint: tokenMint.publicKey,
      redeemableMint: redeemableMint.publicKey,
      poolState: poolStatePubkey,
      tokenVault: tokenVaultPubkey,
      payer: program.provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    },
    signers: [(program.provider.wallet as NodeWallet).payer],
  });
}
