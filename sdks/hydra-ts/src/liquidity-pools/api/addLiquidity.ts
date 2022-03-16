import { PublicKey } from "@solana/web3.js";
import { Ctx } from "../../types";
import * as accs from "../accounts";
import { TOKEN_PROGRAM_ID } from "@project-serum/serum/lib/token-instructions";
import { toBN, tryGet } from "../../utils";
import { inject } from "../../utils/meta-utils";

export function addLiquidity(ctx: Ctx) {
  return async (
    tokenXMaxAmount: bigint,
    tokenYMaxAmount: bigint,
    expectedLpTokens: bigint,
    tokenXMint: PublicKey,
    tokenYMint: PublicKey
  ) => {
    const program = ctx.programs.hydraLiquidityPools;
    const accounts = inject(accs, ctx);
    const {
      tokenXVault,
      tokenYVault,
      lpTokenVault,
      userTokenX,
      userTokenY,
      lpTokenMint,
      lpTokenAssociatedAccount,
      poolState,
    } = await accounts.getAccountLoaders(tokenXMint, tokenYMint);

    await program.rpc.addLiquidity(
      toBN(tokenXMaxAmount),
      toBN(tokenYMaxAmount),
      toBN(expectedLpTokens),
      {
        accounts: {
          poolState: await poolState.key(),
          lpTokenMint: await lpTokenMint.key(),
          userTokenX: await userTokenX.key(),
          userTokenY: await userTokenY.key(),
          user: ctx.provider.wallet.publicKey,
          tokenXVault: await tokenXVault.key(),
          tokenYVault: await tokenYVault.key(),
          lpTokenVault: await lpTokenVault.key(),
          lpTokenTo: await lpTokenAssociatedAccount.key(),
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    );
  };
}
