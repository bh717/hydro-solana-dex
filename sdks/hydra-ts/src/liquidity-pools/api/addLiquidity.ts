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
    lpTokenMint: PublicKey // TODO: do we have to pass this?
  ) => {
    const program = ctx.programs.hydraLiquidityPools;
    const accounts = inject(accs, ctx);
    const {
      tokenXVault,
      tokenYVault,
      lpTokenVault,
      userTokenX,
      userTokenY,
      lpTokenAssociatedAccount,
      poolState,
    } = await accounts.getAccountLoaders(lpTokenMint);

    await program.rpc.addLiquidity(
      toBN(tokenXMaxAmount),
      toBN(tokenYMaxAmount),
      toBN(expectedLpTokens),
      {
        accounts: {
          poolState: await poolState.key(),
          lpTokenMint,
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
