// This is not run with anchor migrate
import * as anchor from "@project-serum/anchor";
import * as localJsonIdl from "target/idl/hydra_staking.json";
import { HydraStaking, IDL } from "types-ts/codegen/types/hydra_staking";
import { loadKey, createMintAndVault, createMint } from "hydra-ts/node"; // these should be moved out of test
import { Keypair } from "@solana/web3.js";
import { HydraSDK } from "hydra-ts";

export default async function (provider: anchor.Provider) {
  anchor.setProvider(provider);

  const hydraStaking = new anchor.web3.PublicKey(
    localJsonIdl["metadata"]["address"]
  );

  const program = new anchor.Program<HydraStaking>(IDL, hydraStaking);

  let TokenAccount = Keypair.generate();

  const tokenMint = await loadKey(
    "keys/localnet/staking/hyd3VthE9YPGBeg9HEgZsrM5qPniC6VoaEFeTGkVsJR.json"
  );
  const redeemableMint = await loadKey(
    "keys/localnet/staking/xhy1rv75cEJahTbsKnv2TpNhdR7KNUoDPavKuQDwhDU.json"
  );

  const sdk = HydraSDK.createFromAnchorProvider(provider, {
    hydraStaking: program.programId.toString(),
    redeemableMint: redeemableMint.publicKey.toString(),
    tokenMint: tokenMint.publicKey.toString(),
  });

  console.log("Creating mint and vault...");
  await createMintAndVault(
    program.provider,
    tokenMint,
    TokenAccount,
    new anchor.BN(100_000_000)
  );

  const tokenVaultPubkey = await sdk.staking.accounts.tokenVault.key();

  console.log(`tokenVaultPubkey:${tokenVaultPubkey}`);

  const tokenVaultBump = await sdk.staking.accounts.tokenVault.bump();

  console.log("Creating mint...");
  await createMint(program.provider, redeemableMint, tokenVaultPubkey);

  const poolStatePubkey = await sdk.staking.accounts.poolState.key();
  const poolStateBump = await sdk.staking.accounts.poolState.bump();

  console.log("Initializing...");
  console.log(`poolStatePubkey:\t${poolStatePubkey}
  tokenVaultPubkey:\t${await sdk.staking.accounts.tokenVault.key()}
  tokenMint:\t\t${tokenMint.publicKey}
  redeemableMint:\t\t${redeemableMint.publicKey}
  `);

  sdk.staking.initialize(tokenVaultBump, poolStateBump);
}
