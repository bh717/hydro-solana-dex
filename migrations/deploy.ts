// This is not run with anchor migrate
import * as anchor from "@project-serum/anchor";
import config from "config-ts/global-config.json";
import * as staking from "types-ts/codegen/types/hydra_staking";
import * as liquidityPools from "types-ts/codegen/types/hydra_liquidity_pools";
import { tokens as localnetTokens } from "config-ts/tokens/localnet.json";
import { loadKey } from "hydra-ts/node"; // these should be moved out of test
import { HydraSDK } from "hydra-ts";
import { Keypair } from "@solana/web3.js";

async function loadTokens<T extends Record<any, string>>(tokens: T) {
  let out: Record<keyof T, Keypair>;
  let entries = Object.entries(tokens) as Array<[keyof T, string]>;
  for (let [symbol, address] of entries) {
    const keypair = await loadKey(`keys/localnet/tokens/${address}.json`);
    out[symbol] = keypair;
  }

  return out;
}

type LocalTokens = Record<keyof typeof localnetTokens, Keypair>;

async function setupStakingState(
  provider: anchor.Provider,
  tokens: LocalTokens
) {
  const hydraStaking = new anchor.web3.PublicKey(
    config.localnet.programIds.hydraStaking
  );

  const program = new anchor.Program<staking.HydraStaking>(
    staking.IDL,
    hydraStaking
  );

  const redeemableMint = tokens["xhyd"];
  const tokenMint = tokens["hyd"];

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

async function setupLiquidityPoolState(
  provider: anchor.Provider,
  tokens: LocalTokens
) {
  const sdk = HydraSDK.createFromAnchorProvider(provider, "localnet");

  // create and distribute tokens to provider wallet
  await sdk.common.createMintAndAssociatedVault(tokens.usdc, 100_000_000n);
  await sdk.common.createMintAndAssociatedVault(tokens.btc, 100_000_000n);
  await sdk.common.createMintAndAssociatedVault(tokens.eth, 100_000_000n);
  await sdk.common.createMintAndAssociatedVault(tokens.xrp, 100_000_000n);
  await sdk.common.createMintAndAssociatedVault(tokens.luna, 100_000_000n);

  const fees = {
    swapFeeNumerator: 1n,
    swapFeeDenominator: 500n,
    ownerTradeFeeNumerator: 0n,
    ownerTradeFeeDenominator: 0n,
    ownerWithdrawFeeNumerator: 0n,
    ownerWithdrawFeeDenominator: 0n,
    hostFeeNumerator: 0n,
    hostFeeDenominator: 0n,
  };

  // Create the btc usdc pool
  await sdk.liquidityPools.initialize(
    tokens.btc.publicKey,
    tokens.usdc.publicKey,
    fees
  );

  // Create the eth usdc pool
  await sdk.liquidityPools.initialize(
    tokens.eth.publicKey,
    tokens.usdc.publicKey,
    fees
  );
}

export default async function (provider: anchor.Provider) {
  anchor.setProvider(provider);
  const tokens = await loadTokens(localnetTokens);
  await setupStakingState(provider, tokens);
  await setupLiquidityPoolState(provider, tokens);
}
