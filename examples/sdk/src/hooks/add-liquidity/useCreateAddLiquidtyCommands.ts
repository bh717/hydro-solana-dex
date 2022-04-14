import { HydraSDK } from "hydra-ts";
import { sortMintSelector } from "../../utils/sortMints";
import { TokenField } from "../useToken";

export function useCreateAddLiquidityCommands(
  sdk: HydraSDK,
  tokenA: TokenField,
  tokenB: TokenField,
  slippage: bigint,
  isInitialized: boolean
) {
  return {
    async executeAddLiquidity() {
      if (!tokenA.mint || !tokenB.mint) return;
      // TODO: Move this stuff to sdk
      const [tokenX, tokenY] = sortMintSelector(
        tokenA,
        tokenB,
        (token: TokenField) => {
          return token.mint!;
        }
      );

      if (!isInitialized) {
        await sdk.liquidityPools.initialize(tokenX.mint!, tokenY.mint!, {
          swapFeeNumerator: 1n,
          swapFeeDenominator: 500n,
          ownerTradeFeeNumerator: 0n,
          ownerTradeFeeDenominator: 0n,
          ownerWithdrawFeeNumerator: 0n,
          ownerWithdrawFeeDenominator: 0n,
          hostFeeNumerator: 0n,
          hostFeeDenominator: 0n,
        });
      }

      await sdk.liquidityPools.addLiquidity(
        tokenX.mint!,
        tokenY.mint!,
        tokenX.amount,
        tokenY.amount,
        slippage
      );
    },
  };
}
