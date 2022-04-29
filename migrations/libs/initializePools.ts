import { InitializePoolConfig } from "./libs";
import { HydraSDK } from "hydra-ts";
import { PoolConfig, getMintKeyFromSymbol } from "./libs";

export async function initializePool(sdk: HydraSDK, pool: PoolConfig) {
  const tokenXKey = getMintKeyFromSymbol(pool.tokenX, sdk.ctx.network);
  const tokenYKey = getMintKeyFromSymbol(pool.tokenY, sdk.ctx.network);
  await sdk.liquidityPools.initialize(tokenXKey, tokenYKey, pool.fees);

  await sdk.liquidityPools.addLiquidity(
    tokenXKey,
    tokenYKey,
    pool.tokenXAmount,
    pool.tokenYAmount
  );
}

export async function initializePools(
  sdk: HydraSDK,
  config: InitializePoolConfig
) {
  for (const pool of config) {
    await initializePool(sdk, pool);
  }
}
