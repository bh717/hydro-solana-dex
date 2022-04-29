import { HydraSDK, Network } from "hydra-ts";
import { quitOnError, createMintAssociatedVaultFromAsset, getAsset } from ".";
import { PublicKey } from "@solana/web3.js";
import { PoolFees } from "hydra-ts/src/liquidity-pools/types";
import { loadKey } from "hydra-ts/node"; // these should be moved out of test
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";

export type InitializeConfig = {
  tokens: InitializeTokensConfig;
  pools: InitializePoolConfig;
  trader: InitializeTraderConfig;
};

export function initializeConfig(network: Network): InitializeConfig {
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
  return {
    tokens: [
      { symbol: "usdc", amount: 100_000_000_000000n }, // 100,000,000.000000
      { symbol: "wbtc", amount: 100_000_000n * 100_000_000n },
      { symbol: "weth", amount: 100_000_000_000000000n }, // 100,000,000.000000000
      {
        symbol: "wsol",
        amount: 100_000_000n * 1_000_000_000n,
      },
    ],
    pools: [
      {
        tokenX: "wbtc",
        tokenY: "usdc",
        tokenXAmount: 1_000n * 1_000_000_000n,
        tokenYAmount: 45_166_800n * 1_000_000n,
        fees,
      },
      {
        tokenX: "weth",
        tokenY: "usdc",
        tokenXAmount: 1_000n * 1_000_000_000n,
        tokenYAmount: 3_281_000n * 1_000_000n,
        fees,
      },
    ],
    trader: {
      tokens: [
        { symbol: "usdc", amount: 100n * 1_000_000n },
        { symbol: "wbtc", amount: 100n * 1_000_000n },
        { symbol: "weth", amount: 100n * 1_000_000n },
        { symbol: "sol", amount: 100n * 1_000_000n },
      ],
      traderKey: "usrQpqgkvUjPgAVnGm8Dk3HmX3qXr1w4gLJMazLNyiW",
    },
  };
}

export type InitializeTokensConfig = Array<{ symbol: string; amount: bigint }>;

export async function initializeTokens(
  sdk: HydraSDK,
  config: InitializeTokensConfig
) {
  let isInitialized = false;
  for (const { symbol } of config) {
    const asset = getAsset(symbol, sdk.ctx.network);
    // Will throw error is mint does not exist
    isInitialized &&= await sdk.accountLoaders
      .mint(new PublicKey(asset.address))
      .isInitialized();
  }
  if (isInitialized) {
    throw new Error("Tokens must not yet be initialized!");
  }
  const atas = new Map<string, PublicKey>();

  for (const { symbol, amount } of config) {
    const asset = getAsset(symbol, sdk.ctx.network);
    atas.set(
      asset.symbol,
      await createMintAssociatedVaultFromAsset(sdk, asset, amount)
    );
  }
  return atas;
}
type PoolConfig = {
  tokenX: string;
  tokenY: string;
  tokenXAmount: bigint;
  tokenYAmount: bigint;
  fees: PoolFees;
};
export type InitializePoolConfig = Array<PoolConfig>;
export async function initializePools(
  sdk: HydraSDK,
  config: InitializePoolConfig
) {
  for (const pool of config) {
    await initializePool(sdk, pool);
  }
}

function getMintKeyFromSymbol(symbol: string, network: Network) {
  const asset = getAsset(symbol, network);
  return new PublicKey(asset.address);
}

export async function initializePool(sdk: HydraSDK, pool: PoolConfig) {
  const tokenXKey = getMintKeyFromSymbol(pool.tokenX, sdk.ctx.network);
  const tokenYKey = getMintKeyFromSymbol(pool.tokenY, sdk.ctx.network);
  await sdk.liquidityPools.initialize(tokenXKey, tokenYKey, pool.fees);

  await sdk.liquidityPools.addLiquidity(
    tokenYKey,
    tokenYKey,
    pool.tokenXAmount,
    pool.tokenYAmount
  );
}

export type InitializeTraderConfig = {
  traderKey: string;
  tokens: Array<{ symbol: string; amount: bigint }>;
};
export async function initializeTrader(
  sdk: HydraSDK,
  config: InitializeTraderConfig,
  srcAccounts: Map<string, PublicKey>
) {
  // Load up a trader account
  const trader = await loadKey(`keys/users/${config.traderKey}.json`);

  const { connection } = sdk.ctx;
  await connection.confirmTransaction(
    await connection.requestAirdrop(trader.publicKey, 10000000000),
    "confirmed"
  );

  const payer = (sdk.ctx.provider.wallet as NodeWallet).payer;

  for (const { symbol, amount } of config.tokens) {
    const mintKey = getMintKeyFromSymbol(symbol, sdk.ctx.network);
    const srcKey = srcAccounts.get(symbol);
    const traderAta = await sdk.common.createAssociatedAccount(
      mintKey,
      trader,
      payer
    );
    await sdk.common.transfer(srcKey, traderAta, amount);
  }
}
