import { IAccountLoader } from "hydra-ts/src/utils/account-loader";
import { useMemo } from "react";
import { useObservable } from "./useObservable";
import { maybeStream } from "../utils/maybeStream";
import { LiquidityPoolAccounts } from "./useLiquidityPoolAccounts";

function useAccountStream<T>(loader?: IAccountLoader<T>) {
  const memoizedStream = useMemo(() => {
    return maybeStream(loader?.stream());
  }, [loader]);

  return useObservable(memoizedStream);
}

export function usePool(accounts?: LiquidityPoolAccounts) {
  // console.log("usePool", { accounts });
  const poolState = useAccountStream(accounts?.poolState);
  const tokenXVault = useAccountStream(accounts?.tokenXVault);
  const tokenYVault = useAccountStream(accounts?.tokenYVault);
  const tokenXMint = useAccountStream(accounts?.tokenXMint);
  const tokenYMint = useAccountStream(accounts?.tokenYMint);

  // accounts.poolState.stream()
  // Returns pool and pool vault state streamed from given accounts
  return useMemo(
    () => ({ poolState, tokenXVault, tokenYVault, tokenXMint, tokenYMint }),
    [poolState, tokenXVault, tokenYVault, tokenXMint, tokenYMint]
  );
}
