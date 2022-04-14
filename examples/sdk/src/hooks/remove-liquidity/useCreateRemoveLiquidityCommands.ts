import { PublicKey } from "@solana/web3.js";
import { HydraSDK } from "hydra-ts";
import { TokenAccount } from "hydra-ts/src/types/token-account";
import { AccountData } from "hydra-ts/src/utils/account-loader";

export function useCreateRemoveLiquidityCommands(
  sdk: HydraSDK,
  percent: bigint, // 10000 basis points
  lpTokenAssociatedAccount: AccountData<TokenAccount> | undefined,
  tokenXMint?: PublicKey,
  tokenYMint?: PublicKey
) {
  return {
    async executeRemoveLiquidity() {
      if (!tokenXMint || !tokenYMint) return;
      // TODO: Move this stuff to sdk
      if (!lpTokenAssociatedAccount?.account.data.amount) return;

      const lpTokensToBurn =
        (percent * lpTokenAssociatedAccount?.account.data.amount) / 100_00n;

      await sdk.liquidityPools.removeLiquidity(
        tokenXMint,
        tokenYMint,
        lpTokensToBurn
      );
    },
  };
}
