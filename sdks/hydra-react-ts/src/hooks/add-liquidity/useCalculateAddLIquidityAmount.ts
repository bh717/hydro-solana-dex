import { usePoolStream } from "../usePoolStream";
import { useCallback, useEffect } from "react";
import { AccountData, HydraSDK, TokenMint } from "hydra-ts";
import { Asset } from "hydra-ts";
import { useToken } from "../useToken";

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
export function useCalculateAddLiquidityAmount(
  client: HydraSDK,
  pool: ReturnType<typeof usePoolStream>,
  tokenFrom: ReturnType<typeof useToken>,
  tokenTo: ReturnType<typeof useToken>,
  focus: "from" | "to"
) {
  const { tokenXMint, tokenYMint, tokenXVault, tokenYVault, poolState } = pool;

  // TODO the following is hack and should be tested
  const calculateAddLiquidity = useCallback(
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

      const ratio =
        direction === "xy"
          ? Number(tokenXVault.account.data.amount) /
            Number(tokenYVault.account.data.amount)
          : Number(tokenYVault.account.data.amount) /
            Number(tokenXVault.account.data.amount);

      const scale =
        direction === "xy"
          ? tokenYMint.account.data.decimals
          : tokenXMint.account.data.decimals;

      const output = BigInt(ratio * Number(amount)) / 10n ** BigInt(scale);

      return { amount: output };
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
      calculateAddLiquidity(tokenFrom.amount, tokenFrom.asset).then(
        (result) => {
          tokenTo.setAmount(result.amount);
        }
      );
    }
    if (focus === "to") {
      if (!tokenTo.asset) return;
      calculateAddLiquidity(tokenTo.amount, tokenTo.asset).then((result) => {
        tokenFrom.setAmount(result.amount);
      });
    }
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [
    // deliberately ignoring tokenTo and
    // tokenFrom changes to avoid re-rendering
    calculateAddLiquidity,
    tokenFrom.asset,
    tokenFrom.amount,
    tokenTo.asset,
    tokenTo.amount,
  ]);
}
