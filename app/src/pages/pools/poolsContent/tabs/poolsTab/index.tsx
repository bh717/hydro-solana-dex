import { useState, useEffect } from "react";
import { makeStyles } from "@mui/styles";
import { Box } from "@mui/material";
import { PublicKey } from "@solana/web3.js";
import { sortMints, HydraSDK } from "hydra-ts";
import { useHydraClient, usePools } from "hydra-react-ts";
import { Asset } from "../../../../../types";

import Filter from "../../filter";
import Pool from "../../pool";

const useStyles = makeStyles({
  tabContainer: {
    display: "flex",
    flexDirection: "column",
  },
  tabContent: {},
});

async function hasLpTokenBalanceOrNull(
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

  return balance > 0n ? ([tokenA, tokenB] as [Asset, Asset]) : null;
}

async function fetchMyPools(client: HydraSDK, pools: [Asset, Asset][]) {
  console.log("Fetching My Pools...");

  const poolOrNull = await Promise.all(
    pools.map(([a, b]) => {
      return hasLpTokenBalanceOrNull(client, a, b);
    })
  );

  return poolOrNull.filter((item) => item !== null) as [Asset, Asset][];
}

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

const PoolsTab = () => {
  const classes = useStyles();

  const pools = usePools();
  const myPools = useMyPools(pools);

  return (
    <Box className={classes.tabContainer}>
      <Filter />
      <Box className={classes.tabContent}>
        {myPools.length > 0 ? (
          myPools.map(([tokenA, tokenB]) => {
            return (
              <Pool
                key={`${tokenA.address}-${tokenB.address}`}
                type="all"
                tokenA={tokenA}
                tokenB={tokenB}
                isDoubleDip={true}
                hasWithdraw={true}
              />
            );
          })
        ) : (
          <></>
        )}
      </Box>
    </Box>
  );
};

export default PoolsTab;
