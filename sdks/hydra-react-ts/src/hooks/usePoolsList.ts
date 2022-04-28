import { useMemo } from "react";
import { Asset } from "hydra-ts";
import { useAssetList } from "./useAssetList";

// This is just to get a list of all pools for now UNORDERED
// We will likely refactor at a point to pull this
// from some kind of analytic service to sort by
// volume or some other metric.
export function usePoolsList() {
  const assets = useAssetList();
  return useMemo(() => {
    const pools = new Map<string, [Asset, Asset]>();
    for (let firstasset of assets) {
      for (let secondasset of assets) {
        if (firstasset.address === secondasset.address) continue;
        const assets = [firstasset, secondasset] as [Asset, Asset];
        const key = assets
          .map(({ address }) => address)
          .sort()
          .join(":");
        if (!pools.has(key)) {
          pools.set(key, assets);
        }
      }
    }

    return Array.from(pools.values());
  }, [assets]);
}
