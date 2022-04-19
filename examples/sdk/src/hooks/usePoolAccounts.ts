import { PublicKey } from "@solana/web3.js";
import { HydraSDK } from "hydra-ts";
import { useEffect, useState } from "react";
import { LiquidityPoolAccounts } from "../types";
import { sortMints } from "../utils/sortMints";

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
