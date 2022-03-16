// This is not run with anchor migrate
import * as anchor from "@project-serum/anchor";
import config from "config-ts/global-config.json";
import * as staking from "types-ts/codegen/types/hydra_staking";
import { loadKey } from "hydra-ts/node"; // these should be moved out of test
import { HydraSDK } from "hydra-ts";

export default async function (provider: anchor.Provider) {
  anchor.setProvider(provider);

  const hydraStaking = new anchor.web3.PublicKey(
    config.localnet.programIds.hydraStaking
  );

  const program = new anchor.Program<staking.HydraStaking>(
    staking.IDL,
    hydraStaking
  );

  const tokenMint = await loadKey(
    "keys/localnet/staking/hyd3VthE9YPGBeg9HEgZsrM5qPniC6VoaEFeTGkVsJR.json"
  );
  const redeemableMint = await loadKey(
    "keys/localnet/staking/xhy1rv75cEJahTbsKnv2TpNhdR7KNUoDPavKuQDwhDU.json"
  );

  const programMap = {
    hydraStaking: program.programId.toString(),
    redeemableMint: redeemableMint.publicKey.toString(),
    tokenMint: tokenMint.publicKey.toString(),
  };

  const sdk = HydraSDK.createFromAnchorProvider(provider, {
    ...config.localnet.programIds,
    ...programMap,
  });

  console.log("Creating mint and vault...");

  // create tokenMint
  await sdk.common.createMintAndAssociatedVault(tokenMint, 100_000_000n);

  const tokenVaultPubkey = await sdk.staking.accounts.tokenVault.key();
  const tokenVaultBump = await sdk.staking.accounts.tokenVault.bump();

  console.log("Creating mint...");
  await sdk.common.createMint(redeemableMint, tokenVaultPubkey, 9);

  const poolStatePubkey = await sdk.staking.accounts.poolState.key();
  const poolStateBump = await sdk.staking.accounts.poolState.bump();

  console.log("Initializing...");
  console.log(`
deployingAs:\t${sdk.ctx.provider.wallet.publicKey}
poolStatePubkey:\t${poolStatePubkey}
tokenVaultPubkey:\t${await sdk.staking.accounts.tokenVault.key()}
tokenMint:\t\t${tokenMint.publicKey}
redeemableMint:\t\t${redeemableMint.publicKey}
  `);

  await sdk.staking.initialize(tokenVaultBump, poolStateBump);
}
