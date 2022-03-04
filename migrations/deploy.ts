// This is not run with anchor migrate
import * as anchor from "@project-serum/anchor";
import config from "config-ts/global-config.json";
import { HydraStaking, IDL } from "types-ts/codegen/types/hydra_staking";
import { loadKey } from "hydra-ts/node"; // these should be moved out of test
import { HydraSDK } from "hydra-ts";
// import { createMintAndVault, createMint } from "hydra-ts";
// import { createTokenAccount } from "@project-serum/common";
import { Keypair } from "@solana/web3.js";

export default async function (provider: anchor.Provider) {
  anchor.setProvider(provider);

  const hydraStaking = new anchor.web3.PublicKey(
    config.localnet.programIds.hydraStaking
  );

  const program = new anchor.Program<HydraStaking>(IDL, hydraStaking);

  const tokenMint = await loadKey(
    "keys/localnet/staking/hyd3VthE9YPGBeg9HEgZsrM5qPniC6VoaEFeTGkVsJR.json"
  );
  const redeemableMint = await loadKey(
    "keys/localnet/staking/xhy1rv75cEJahTbsKnv2TpNhdR7KNUoDPavKuQDwhDU.json"
  );

  const userToken = Keypair.generate();

  const programMap = {
    hydraStaking: program.programId.toString(),
    redeemableMint: redeemableMint.publicKey.toString(),
    tokenMint: tokenMint.publicKey.toString(),
  };

  const sdk = HydraSDK.createFromAnchorProvider(provider, programMap);

  console.log("Creating mint and vault...");

  // create tokenMint
  await sdk.common.createMintAndVault(tokenMint, userToken, 100_000_000n);

  const tokenVaultPubkey = await sdk.staking.accounts.tokenVault.key();
  const tokenVaultBump = await sdk.staking.accounts.tokenVault.bump();

  console.log("Creating mint...");
  await sdk.common.createMint(redeemableMint, tokenVaultPubkey);

  const receiveAcc = await sdk.common.createTokenAccount(
    redeemableMint.publicKey,
    program.provider.wallet.publicKey
  );

  console.log("receiveAcc:", receiveAcc.toString());
  const poolStatePubkey = await sdk.staking.accounts.poolState.key();
  const poolStateBump = await sdk.staking.accounts.poolState.bump();

  console.log("Initializing...");
  console.log(`
poolStatePubkey:\t${poolStatePubkey}
tokenVaultPubkey:\t${await sdk.staking.accounts.tokenVault.key()}
tokenMint:\t\t${tokenMint.publicKey}
redeemableMint:\t\t${redeemableMint.publicKey}
  `);

  await sdk.staking.initialize(tokenVaultBump, poolStateBump);

  console.log(
    "balance: ",
    await sdk.common.getTokenBalance(
      await sdk.staking.accounts.tokenVault.key()
    )
  );

  console.log(
    "info: ",
    await sdk.common.getTokenAccountInfo(
      await sdk.staking.accounts.tokenVault.key()
    )
  );
}
