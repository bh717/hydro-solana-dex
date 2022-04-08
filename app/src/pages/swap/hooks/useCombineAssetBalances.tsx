import { useMemo } from "react";
import { Asset } from "../../../types";

export function useCombineAssetBalances(
  assetList: Asset[],
  balances: bigint[] | undefined
) {
  return useMemo(
    () =>
      assetList.map((asset, index) => ({
        ...asset,
        balance: balances ? balances[index] : 0n,
      })),
    [assetList, balances]
  );
}
