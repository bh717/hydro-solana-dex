import { PublicKey } from "@solana/web3.js";
import { HydraSDK, IAccountLoader, TokenMint } from "hydra-ts";
import { useEffect, useState } from "react";
import { sortMints } from "hydra-ts";

// TODO: Export these types from hydra-ts
export type PromiseVal<T> = T extends Promise<infer J> ? J : never;
export type LiquidityPoolAccounts = PromiseVal<
  ReturnType<HydraSDK["liquidityPools"]["accounts"]["getAccountLoaders"]>
> & {
  tokenXMint: IAccountLoader<TokenMint>;
  tokenYMint: IAccountLoader<TokenMint>;
};

export function usePoolAccounts(
  client: HydraSDK,
  // A or B = unsorted mints
  tokenAMintKey?: PublicKey,
  tokenBMintKey?: PublicKey
) {
  const [accounts, setAccounts] = useState<LiquidityPoolAccounts | undefined>();

  useEffect(() => {
    if (!tokenAMintKey || !tokenBMintKey) return;

    const [tokenXMint, tokenYMint] = sortMints(tokenAMintKey, tokenBMintKey);

    client.liquidityPools.accounts
      .getAccountLoaders(tokenXMint, tokenYMint)
      .then((accs) => {
        setAccounts({
          ...accs,
          tokenXMint: client.accountLoaders.mint(tokenXMint),
          tokenYMint: client.accountLoaders.mint(tokenYMint),
        });
      });
  }, [client, tokenAMintKey, tokenBMintKey]);

  return accounts;
}
