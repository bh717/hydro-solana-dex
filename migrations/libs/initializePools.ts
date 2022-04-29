import { InitializePoolConfig } from "./libs";
import { HydraSDK, sortMints } from "hydra-ts";
import { PoolConfig, getMintKeyFromSymbol } from "./libs";

export async function initializePool(sdk: HydraSDK, pool: PoolConfig) {
  const tokenAKey = getMintKeyFromSymbol(pool.tokenX, sdk.ctx.network);
  const tokenBKey = getMintKeyFromSymbol(pool.tokenY, sdk.ctx.network);
  const [tokenXKey, tokenYKey] = sortMints(tokenAKey, tokenBKey);
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
