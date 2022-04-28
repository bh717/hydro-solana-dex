import { HydraSDK } from "hydra-ts";
import { TokenField } from "../useToken";
import { sortMints } from "hydra-ts";

// take token form state and create swap commands
export function useCreateSwapCommand(
  sdk: HydraSDK,
  tokenFrom: TokenField,
  tokenTo: TokenField,
  minimumAmountOut: bigint
) {
  async function executeSwap() {
    if (!tokenFrom.mint || !tokenTo.mint) return;
    // TODO: Move this stuff to sdk
    const [tokenXMint, tokenYMint] = sortMints(tokenFrom.mint, tokenTo.mint);

    const tokenFromAccount = await sdk.accountLoaders
      .associatedToken(tokenFrom.mint)
      .key();

    const tokenToAccount = await sdk.accountLoaders
      .associatedToken(tokenTo.mint)
      .key();

    const { amount } = tokenFrom;

    await sdk.liquidityPools.swap(
      tokenXMint,
      tokenYMint,
      tokenFromAccount,
      tokenToAccount,
      amount,
      minimumAmountOut
    );
  }
  return { executeSwap };
}
