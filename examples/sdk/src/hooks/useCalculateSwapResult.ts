import { usePool } from "./usePool";
import { useCallback, useEffect, useState } from "react";
import { HydraSDK } from "hydra-ts";
import { Asset } from "../types";
import { getDirection } from "./useSwap";

export function useCalculateSwapResult(
  client: HydraSDK,
  pool: ReturnType<typeof usePool>,
  amount: bigint,
  asset?: Asset
) {
  const [result, setResult] = useState<{
    amount: bigint;
    fees: bigint;
  }>({ amount: 0n, fees: 0n });

  const { tokenXMint, tokenYMint, tokenXVault, tokenYVault, poolState } = pool;

  const calculateSwap = useCallback(
    async (amount: bigint, asset: Asset) => {
      // console.log(`calculateSwap(${amount}, ${asset.symbol})`);

      if (
        !tokenXMint ||
        !tokenYMint ||
        !tokenXVault ||
        !tokenYVault ||
        !poolState
      )
        return { amount: 0n, fees: 0n };

      const direction = getDirection(tokenXMint, tokenYMint, asset.address);

      if (!direction) throw new Error("Asset is not part of pool mints");

      const [, , deltaX, deltaY, fees] =
        await client.liquidityPools.calculateSwap(
          tokenXMint,
          tokenYMint,
          tokenXVault,
          tokenYVault,
          poolState,
          amount,
          direction
        );
      // console.log({ xNew, yNew, deltaX, deltaY, fees });
      const out = { amount: direction === "xy" ? deltaY : deltaX, fees };
      return out;
    },
    [
      tokenXMint,
      tokenYMint,
      tokenXVault,
      tokenYVault,
      poolState,
      client.liquidityPools,
    ]
  );

  useEffect(() => {
    if (!asset) return;

    calculateSwap(amount, asset).then(setResult);
  }, [calculateSwap, amount, asset]);

  return result;
}
