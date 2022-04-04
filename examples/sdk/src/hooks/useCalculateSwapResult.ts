import { usePool } from "./usePool";
import { useCallback, useEffect } from "react";
import { HydraSDK } from "hydra-ts";
import { Asset } from "../types";
import { getDirection } from "./useSwap";
import { useToken } from "./useToken";

export function useCalculateSwapResult(
  client: HydraSDK,
  pool: ReturnType<typeof usePool>,
  tokenFrom: ReturnType<typeof useToken>,
  tokenTo: ReturnType<typeof useToken>,
  focus: "from" | "to"
) {
  // const { amount, asset } = tokenFrom;
  console.log({ focus });
  const { tokenXMint, tokenYMint, tokenXVault, tokenYVault, poolState } = pool;

  const calculateSwap = useCallback(
    async (amount: bigint, asset: Asset) => {
      if (
        !tokenXMint ||
        !tokenYMint ||
        !tokenXVault ||
        !tokenYVault ||
        !poolState
      )
        return { amount: 0n, fees: 0n };

      let direction = getDirection(tokenXMint, tokenYMint, asset.address);

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
    if (focus === "from") {
      if (!tokenFrom.asset) return;
      calculateSwap(tokenFrom.amount, tokenFrom.asset).then((result) => {
        tokenTo.setAmount(result.amount);
      });
    }
    if (focus === "to") {
      if (!tokenTo.asset) return;
      calculateSwap(tokenTo.amount, tokenTo.asset).then((result) => {
        tokenFrom.setAmount(result.amount);
      });
    }
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [
    // deliberately ignoring tokenTo and
    // tokenFrom changes to avoid re-rendering
    calculateSwap,
    tokenFrom.asset,
    tokenFrom.amount,
    tokenTo.asset,
    tokenTo.amount,
  ]);
}
