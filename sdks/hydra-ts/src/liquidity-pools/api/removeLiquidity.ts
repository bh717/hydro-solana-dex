import { PublicKey } from "@solana/web3.js";
import { Ctx } from "../../types";
import * as accs from "../accounts";
import { TOKEN_PROGRAM_ID } from "@project-serum/serum/lib/token-instructions";
import { toBN, tryGet } from "../../utils";
import { inject } from "../../utils/meta-utils";
export function removeLiquidity(ctx: Ctx) {
  return async (
    tokenXMint: PublicKey,
    tokenYMint: PublicKey,
    lpTokensToBurn: bigint
  ) => {
    const program = ctx.programs.hydraLiquidityPools;

    const {
      tokenXVault,
      tokenYVault,
      userTokenX,
      userTokenY,
      lpTokenAssociatedAccount,
      poolState,
      lpTokenMint,
    } = await inject(accs, ctx).getAccountLoaders(tokenXMint, tokenYMint);

    const accounts = {
      poolState: await poolState.key(),
      lpTokenMint: await lpTokenMint.key(),
      userTokenX: await userTokenX.key(),
      userTokenY: await userTokenY.key(),
      user: ctx.provider.wallet.publicKey,
      tokenXVault: await tokenXVault.key(),
      tokenYVault: await tokenYVault.key(),
      userRedeemableLpTokens: await lpTokenAssociatedAccount.key(),
      tokenProgram: TOKEN_PROGRAM_ID,
    };

    await program.rpc.removeLiquidity(toBN(lpTokensToBurn), {
      accounts,
    });
  };
}
