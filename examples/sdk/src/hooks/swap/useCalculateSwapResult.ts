import { usePoolStream } from "../usePoolStream";
import { useCallback, useEffect } from "react";
import { HydraSDK } from "hydra-ts";
import { Asset } from "../../types";
import { useToken } from "../useToken";
import { AccountData } from "hydra-ts/src/utils/account-loader";
import { TokenMint } from "hydra-ts/src/types/token-mint";

export function getDirection(
  tokenXMint: AccountData<TokenMint>,
  tokenYMint: AccountData<TokenMint>,
  address: string
): "xy" | "yx" | null {
  return `${tokenXMint.pubkey}` === address
    ? "xy"
    : `${tokenYMint.pubkey}`
    ? "yx"
    : null;
}

// take the selected pool and token form data
// set the appropriate fields based on user input
// calculating swap estimates
export function useCalculateSwapResult(
  client: HydraSDK,
  pool: ReturnType<typeof usePoolStream>,
  tokenFrom: ReturnType<typeof useToken>,
  tokenTo: ReturnType<typeof useToken>,
  focus: "from" | "to"
) {
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
