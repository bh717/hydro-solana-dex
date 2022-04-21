import { useHydraClient } from "../components/HydraClientProvider";
import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { Asset } from "../types";
import { combineLatest } from "rxjs";
import { map, tap } from "rxjs/operators";

export function useBalances(assetList: Asset[]) {
  const client = useHydraClient();
  return useMemo(() => {
    const streamList$ = assetList.map((asset) => {
      return client.accountLoaders
        .associatedToken(new PublicKey(asset.address))
        .changes()
        .pipe(
          tap((account) =>
            console.log(
              `useBalances: ${asset.symbol}:`,
              account?.account.data.amount
            )
          ),
          map((account) => {
            // console.log(
            //   `balance out:${asset.address}`,
            //   account?.account.data.amount
            // );
            return account?.account.data.amount ?? 0n;
          })
        );
    });
    return combineLatest(streamList$);
  }, [assetList, client]);
}
