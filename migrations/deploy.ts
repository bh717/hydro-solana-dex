// This is not run with anchor migrate
import * as anchor from "@project-serum/anchor";
import config from "config-ts/global-config.json";
import * as staking from "types-ts/codegen/types/hydra_staking";
import * as liquidityPools from "types-ts/codegen/types/hydra_liquidity_pools";
import { tokens as localnetTokens } from "config-ts/tokens/localnet.json";
import { loadKey } from "hydra-ts/node"; // these should be moved out of test
import { HydraSDK } from "hydra-ts";
import { Keypair } from "@solana/web3.js";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";

type Lookup<T> = Record<keyof T, Keypair>;
async function loadTokens<T extends Record<any, string>>(tokens: T) {
  let out: Partial<Lookup<T>> = {};
  let entries = Object.entries(tokens) as Array<[keyof T, string]>;
  for (let [symbol, address] of entries) {
    const keypair = await loadKey(`keys/localnet/tokens/${address}.json`);
    out[symbol] = keypair;
  }

  return out as Lookup<T>;
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
  // The idea here is we use the provider.wallet as "god" mint tokens to them
  // and then transfer those tokens to to a "trader" account
  const sdk = HydraSDK.createFromAnchorProvider(provider, "localnet");

  // 1. create and distribute tokens to the god wallet

  console.log("Creating usdc...");
  const [, usdcATA] = await sdk.common.createMintAndAssociatedVault(
    tokens.usdc,
    1000n * 1_000_000n
  );
  console.log("Creating btc...");
  const [, btcATA] = await sdk.common.createMintAndAssociatedVault(
    tokens.btc,
    1000n * 1_000_000n
  );
  console.log("Creating eth...");
  const [, ethATA] = await sdk.common.createMintAndAssociatedVault(
    tokens.eth,
    1000n * 1_000_000n
  );
  console.log("Creating xrp...");
  const [, xrpATA] = await sdk.common.createMintAndAssociatedVault(
    tokens.xrp,
    1000n * 1_000_000n
  );
  console.log("Creating luna...");
  const [, lunaATA] = await sdk.common.createMintAndAssociatedVault(
    tokens.luna,
    1000n * 1_000_000n
  );

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

  // 2. Initialize a couple of pools

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

  // Load up a trader account
  const trader = await loadKey(
    `keys/localnet/users/usrQpqgkvUjPgAVnGm8Dk3HmX3qXr1w4gLJMazLNyiW.json`
  );

  // 3. Transfer some funds to the trader account
  const traderUsdc = await sdk.common.createAssociatedAccount(
    tokens["usdc"].publicKey,
    trader,
    (provider.wallet as NodeWallet).payer
  );
  await sdk.common.transfer(usdcATA, traderUsdc, 100n * 1_000_000n);

  const traderBtc = await sdk.common.createAssociatedAccount(
    tokens["btc"].publicKey,
    trader,
    (provider.wallet as NodeWallet).payer
  );
  await sdk.common.transfer(btcATA, traderBtc, 100n * 1_000_000n);

  const traderEth = await sdk.common.createAssociatedAccount(
    tokens["eth"].publicKey,
    trader,
    (provider.wallet as NodeWallet).payer
  );
  await sdk.common.transfer(ethATA, traderEth, 100n * 1_000_000n);

  const traderLuna = await sdk.common.createAssociatedAccount(
    tokens["luna"].publicKey,
    trader,
    (provider.wallet as NodeWallet).payer
  );
  await sdk.common.transfer(lunaATA, traderLuna, 100n * 1_000_000n);

  const traderXrp = await sdk.common.createAssociatedAccount(
    tokens["xrp"].publicKey,
    trader,
    (provider.wallet as NodeWallet).payer
  );
  await sdk.common.transfer(xrpATA, traderXrp, 100n * 1_000_000n);

  // Ok so now if you load up the private keys for both god and the
  // trader in your test wallet, you should be able to play around with the app on localhost:

  // yarn private-key ./keys/users/usrQpqgkvUjPgAVnGm8Dk3HmX3qXr1w4gLJMazLNyiW.json
  // yarn private-key ~/.config/solana/id.json
}

export default async function (provider: anchor.Provider) {
  anchor.setProvider(provider);
  const tokens = await loadTokens(localnetTokens);
  await setupStakingState(provider, tokens);
  await setupLiquidityPoolState(provider, tokens);
}
