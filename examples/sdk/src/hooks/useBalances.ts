import { useHydraClient } from "../components/HydraClientProvider";
import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { Asset } from "../types";
import { combineLatest } from "rxjs";
import { map } from "rxjs/operators";

export function useBalances(assetList: Asset[]) {
  const client = useHydraClient();
  return useMemo(() => {
    return combineLatest(
      assetList.map((asset) =>
        client.accountLoaders
          .associatedToken(new PublicKey(asset.address))
          .stream()
          .pipe(map((account) => account?.account.data.amount ?? 0n))
      )
    );
  }, [assetList, client]);
}
