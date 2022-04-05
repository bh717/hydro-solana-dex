import { HydraSDK } from "hydra-ts";
import { TokenField } from "./useToken";
import { PublicKey } from "@solana/web3.js";

export function useCreateSwapCommand(
  sdk: HydraSDK,
  // Userspace input token fields
  tokenFrom: TokenField,
  tokenTo: TokenField,
  // Pool Token X/Y
  tokenXMint?: PublicKey,
  tokenYMint?: PublicKey
) {
  async function executeSwap() {
    if (!tokenXMint || !tokenYMint || !tokenFrom.mint || !tokenTo.mint) return;

    const tokenFromAccount = await sdk.accountLoaders
      .associatedToken(tokenFrom.mint)
      .key();

    const tokenToAccount = await sdk.accountLoaders
      .associatedToken(tokenTo.mint)
      .key();

    const { amount } = tokenFrom;

    // do a swap calculation and multiply the output by slippage
    // calculateSwap = sdk.liquidityPools.swapXToYAmm : sdk.liquidityPools.swapYToXAmm
    await sdk.liquidityPools.swap(
      tokenXMint,
      tokenYMint,
      tokenFromAccount,
      tokenToAccount,
      amount,
      0n // TODO: calculate based on slippage
    );
  }
  return { executeSwap };
}
