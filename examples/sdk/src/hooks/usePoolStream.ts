import { useMemo } from "react";
import { HydraSDK } from "hydra-ts";
import { PublicKey } from "@solana/web3.js";
import { useAccountStream } from "./useAccountStream";
import { usePoolAccounts } from "./usePoolAccounts";

/**
 * Stream detailed pool data for tracking pool data
 * @param client HydraClient
 * @param tokenAMintKey TokenA mint key
 * @param tokenBMintKey TokenB mint key
 * @returns
 */
export function usePoolStream(
  client: HydraSDK,
  // A or B = unsorted mints
  tokenAMintKey?: PublicKey,
  tokenBMintKey?: PublicKey
) {
  const accounts = usePoolAccounts(client, tokenAMintKey, tokenBMintKey);

  const poolState = useAccountStream(accounts?.poolState);
  const tokenXVault = useAccountStream(accounts?.tokenXVault);
  const tokenYVault = useAccountStream(accounts?.tokenYVault);
  const tokenXMint = useAccountStream(accounts?.tokenXMint);
  const tokenYMint = useAccountStream(accounts?.tokenYMint);
  const lpTokenMint = useAccountStream(accounts?.lpTokenMint);
  const lpTokenAssociatedAccount = useAccountStream(
    accounts?.lpTokenAssociatedAccount
  );

  const isInitialized = Boolean(poolState);
  const isValid = Boolean(accounts);

  // Returns pool and pool vault state streamed from given accounts
  return useMemo(
    () => ({
      poolState,
      tokenXVault,
      tokenYVault,
      tokenXMint,
      tokenYMint,
      lpTokenMint,
      lpTokenAssociatedAccount,
      isInitialized,
      isValid,
    }),
    [
      poolState,
      tokenXVault,
      tokenYVault,
      tokenXMint,
      tokenYMint,
      lpTokenMint,
      lpTokenAssociatedAccount,
      isInitialized,
      isValid,
    ]
  );
}
