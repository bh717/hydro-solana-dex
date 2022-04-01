import { PublicKey } from "@solana/web3.js";
import { HydraSDK } from "hydra-ts";
import { TokenMint } from "hydra-ts/src/types/token-mint";
import { IAccountLoader } from "hydra-ts/src/utils/account-loader";
import { useEffect, useState } from "react";
import { PromiseVal } from "../types";

export type LiquidityPoolAccounts = PromiseVal<
  ReturnType<HydraSDK["liquidityPools"]["accounts"]["getAccountLoaders"]>
> & {
  tokenXMint: IAccountLoader<TokenMint>;
  tokenYMint: IAccountLoader<TokenMint>;
};

function sortKeys(tokenA: PublicKey, tokenB: PublicKey) {
  return tokenA.toBuffer().compare(tokenB.toBuffer());
}

export function useLiquidityPoolAccounts(
  client: HydraSDK,
  tokenXMint?: PublicKey,
  tokenYMint?: PublicKey
) {
  const [accounts, setAccounts] = useState<LiquidityPoolAccounts | undefined>();

  useEffect(() => {
    // console.log("useLiquidityPoolAccounts", { client, tokenXMint, tokenYMint });
    if (!tokenXMint || !tokenYMint) return;

    const tokens: [PublicKey, PublicKey] = [tokenXMint, tokenYMint];
    const sortedTokens = tokens.sort(sortKeys);

    // console.log(
    //   "sortedTokens:",
    //   sortedTokens.map((s) => s.toString())
    // );

    client.liquidityPools.accounts
      .getAccountLoaders(...sortedTokens)
      .then((accs) => {
        setAccounts({
          ...accs,
          tokenXMint: client.accountLoaders.mint(tokenXMint),
          tokenYMint: client.accountLoaders.mint(tokenYMint),
        });
      });
  }, [client, tokenXMint, tokenYMint]);

  if (!tokenXMint || !tokenYMint) return undefined;

  return accounts;
}
