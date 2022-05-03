import { Asset, HydraSDK, sortMints } from "hydra-ts";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { useHydraClient, usePools } from "..";
import { filterAsync } from "../utils";

async function poolIsInitialized(
  client: HydraSDK,
  tokenA: Asset,
  tokenB: Asset
) {
  const accounts = await client.liquidityPools.accounts.getAccountLoaders(
    ...sortMints(new PublicKey(tokenA.address), new PublicKey(tokenB.address))
  );

  if (await accounts.poolState.isInitialized()) return true;

  return false;
}

export function useExistingPools() {
  const client = useHydraClient();
  const [list, setList] = useState<[Asset, Asset][]>([]);
  const pools = usePools();

  useEffect(() => {
    filterAsync(
      pools,
      async ([a, b]) => !!(await poolIsInitialized(client, a, b))
    ).then((filteredPools) => {
      setList(filteredPools);
    });
  }, [client, pools]);

  return list;
}
