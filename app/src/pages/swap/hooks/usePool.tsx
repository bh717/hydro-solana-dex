import { IAccountLoader } from "hydra-ts";
import { useEffect, useMemo, useState } from "react";
import { useObservable } from "../../../hooks/useObservable";
import { maybeStream } from "../../../utils/maybeStream";
import { HydraSDK } from "hydra-ts";
import { PublicKey } from "@solana/web3.js";
import { TokenMint } from "hydra-ts";
import { PromiseVal } from "../../../types";

function useAccountStream<T>(loader?: IAccountLoader<T>) {
  const memoizedStream = useMemo(() => {
    // @ts-ignore:next-line
    return maybeStream(loader?.stream());
  }, [loader]);

  return useObservable(memoizedStream);
}

function sortKeys(tokenA: PublicKey, tokenB: PublicKey) {
  return tokenA.toBuffer().compare(tokenB.toBuffer());
}

type LiquidityPoolAccounts = PromiseVal<
  ReturnType<HydraSDK["liquidityPools"]["accounts"]["getAccountLoaders"]>
> & {
  tokenXMint: IAccountLoader<TokenMint>;
  tokenYMint: IAccountLoader<TokenMint>;
};
export function usePool(
  client: HydraSDK,
  tokenXMintKey?: PublicKey,
  tokenYMintKey?: PublicKey
) {
  const [accounts, setAccounts] = useState<LiquidityPoolAccounts | undefined>();

  useEffect(() => {
    if (!tokenXMintKey || !tokenYMintKey) return;

    const tokens: [PublicKey, PublicKey] = [tokenXMintKey, tokenYMintKey];
    const sortedTokens = tokens.sort(sortKeys);

    client.liquidityPools.accounts
      .getAccountLoaders(...sortedTokens)
      .then((accs) => {
        setAccounts({
          ...accs,
          tokenXMint: client.accountLoaders.mint(tokenXMintKey),
          tokenYMint: client.accountLoaders.mint(tokenYMintKey),
        });
      });
  }, [client, tokenXMintKey, tokenYMintKey]);

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
