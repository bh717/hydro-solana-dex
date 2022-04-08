import { createContext, useContext } from "react";
import { HydraSDK } from "hydra-ts";
import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { Asset } from "../../../types";
import { combineLatest } from "rxjs";
import { map } from "rxjs/operators";

const HydraClientContext = createContext({} as HydraSDK);

export function useHydraClient() {
  return useContext(HydraClientContext);
}

export function useBalances(assetList: Asset[]) {
  const client = useHydraClient();
  return useMemo(() => {
    const streamList$ = assetList.map((asset) => {
      console.log("mapping...");
      return client.accountLoaders
        .associatedToken(new PublicKey(asset.address))
        .stream()
        .pipe(map((account) => account?.account?.data?.amount ?? 0n));
    });
    return combineLatest(streamList$);
  }, [assetList, client]);
}
