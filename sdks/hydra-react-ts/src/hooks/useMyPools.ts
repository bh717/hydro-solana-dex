import { Asset, HydraSDK, sortMints } from "hydra-ts";
import { useEffect, useState } from "react";
import { useHydraClient, usePools } from "..";
import { PublicKey } from "@solana/web3.js";
import { filterAsync } from "../utils";

async function walletHoldsLpTokenBalance(
  client: HydraSDK,
  tokenA: Asset,
  tokenB: Asset
) {
  const accounts = await client.liquidityPools.accounts.getAccountLoaders(
    ...sortMints(new PublicKey(tokenA.address), new PublicKey(tokenB.address))
  );

  if (!(await accounts.lpTokenAssociatedAccount.isInitialized())) return null;

  const info = await accounts.lpTokenAssociatedAccount.info();
  const balance = info.data.amount ?? 0n;

  return balance > 0n;
}

export function useMyPools() {
  const client = useHydraClient();
  const [list, setList] = useState<[Asset, Asset][]>([]);
  const pools = usePools();

  useEffect(() => {
    filterAsync(
      pools,
      async ([a, b]) => !!(await walletHoldsLpTokenBalance(client, a, b))
    ).then((filteredPools) => {
      setList(filteredPools);
    });
  }, [client, pools]);

  return list;
}
