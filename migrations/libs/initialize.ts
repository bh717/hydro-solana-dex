import { HydraSDK, Network } from "hydra-ts";
import { getAsset } from "./getAsset";
import { PublicKey } from "@solana/web3.js";
import { PoolFees } from "hydra-ts/src/liquidity-pools/types";

export type InitializeConfig = {
  tokens: InitializeTokensConfig;
  pools: InitializePoolConfig;
  trader: InitializeTraderConfig;
};

export type InitializeTokensConfig = Array<{ symbol: string; amount: bigint }>;

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

export function getMintKeyFromSymbol(symbol: string, network: Network) {
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
