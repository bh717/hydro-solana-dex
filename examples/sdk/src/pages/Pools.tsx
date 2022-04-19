// TODO:
// - list all pools
// - click on a pool to remove liquidity
// - click on a pool to add liquidity

import { PublicKey } from "@solana/web3.js";
import { HydraSDK } from "hydra-ts";
import { useCallback, useEffect, useState } from "react";
import { useHydraClient } from "../components/HydraClientProvider";

import { usePools } from "../hooks/usePools";
import { Asset } from "../types";
import { Button } from "@mui/material";
import { sortMints } from "../utils/sortMints";

async function hasLpTokenBalanceOrNull(
  client: HydraSDK,
  // A or B = unsorted mints
  tokenA: Asset,
  tokenB: Asset
) {
  const accounts = await client.liquidityPools.accounts.getAccountLoaders(
    ...sortMints(new PublicKey(tokenA.address), new PublicKey(tokenB.address))
  );

  if (!(await accounts.lpTokenAssociatedAccount.isInitialized())) return null;

  const info = await accounts.lpTokenAssociatedAccount.info();
  const balance = info.data.amount ?? 0n;

  return balance > 0n ? ([tokenA, tokenB] as [Asset, Asset]) : null;
}

async function fetchMyPools(client: HydraSDK, pools: [Asset, Asset][]) {
  console.log("fetchMyPools...");
  const poolOrNull = await Promise.all(
    pools.map(([a, b]) => {
      return hasLpTokenBalanceOrNull(client, a, b);
    })
  );
  return poolOrNull.filter((item) => item !== null) as [Asset, Asset][];
}

function PoolItem({
  tokenA,
  tokenB,
  onAddLiquidity,
  onRemoveLiquidity,
}: {
  tokenA: Asset;
  tokenB: Asset;
  onAddLiquidity: (tokenX: string, tokenY: string) => void;
  onRemoveLiquidity: (tokenX: string, tokenY: string) => void;
}) {
  const handleAdd = useCallback(() => {
    onAddLiquidity(tokenA.address, tokenB.address);
  }, [tokenA.address, tokenB.address, onAddLiquidity]);

  const handleRemove = useCallback(() => {
    onRemoveLiquidity(tokenA.address, tokenB.address);
  }, [tokenA.address, tokenB.address, onRemoveLiquidity]);

  return (
    <div>
      <div>
        {tokenA.symbol}:{tokenB.symbol}
      </div>
      <div>
        <Button onClick={handleAdd}>Add Liquidity</Button>
        <Button onClick={handleRemove}>Remove Liquidity</Button>
      </div>
    </div>
  );
}

type PoolsProps = {
  onAddLiquidity: (tokenX: string, tokenY: string) => void;
  onRemoveLiquidity: (tokenX: string, tokenY: string) => void;
};

function useMyPools(pools: [Asset, Asset][]) {
  const client = useHydraClient();
  const [list, setList] = useState<[Asset, Asset][]>([]);

  useEffect(() => {
    fetchMyPools(client, pools).then((filteredPools) => {
      setList(filteredPools);
    });
  }, [client, pools]);

  return list;
}

export function Pools({ onAddLiquidity, onRemoveLiquidity }: PoolsProps) {
  const pools = usePools();
  const myPools = useMyPools(pools);

  return (
    <>
      <div>
        {myPools.length > 0 ? (
          myPools.map(([tokenA, tokenB]) => {
            return (
              <PoolItem
                key={[tokenA.address, tokenB.address].join(":")}
                tokenA={tokenA}
                tokenB={tokenB}
                onAddLiquidity={onAddLiquidity}
                onRemoveLiquidity={onRemoveLiquidity}
              />
            );
          })
        ) : (
          <div>No pools found</div>
        )}
      </div>
    </>
  );
}
