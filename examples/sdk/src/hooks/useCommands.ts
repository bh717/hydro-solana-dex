import { useTokenForm } from "./useTokenForm";
import { HydraSDK } from "hydra-ts";

export function useCommands(
  sdk: HydraSDK,
  tokenFormProps: ReturnType<typeof useTokenForm>
) {
  async function executeSwap() {
    const { tokenXMint, tokenYMint, tokenFrom, tokenTo } = tokenFormProps;

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
