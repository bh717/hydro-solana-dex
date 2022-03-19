import { PublicKey } from "@solana/web3.js";
import { Ctx } from "../../types";
import * as accs from "../accounts";
import { TOKEN_PROGRAM_ID } from "@project-serum/serum/lib/token-instructions";
import { toBN, tryGet } from "../../utils";
import * as SPLToken from "@solana/spl-token";
import { web3 } from "@project-serum/anchor";
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

    await program.rpc.removeLiquidity(toBN(lpTokensToBurn), {
      accounts: {
        poolState: await poolState.key(),
        lpTokenMint: await lpTokenMint.key(),
        userTokenX: await userTokenX.key(),
        userTokenY: await userTokenY.key(),
        user: ctx.provider.wallet.publicKey,
        tokenXVault: await tokenXVault.key(),
        tokenYVault: await tokenYVault.key(),
        tokenXMint,
        tokenYMint,
        userRedeemableLpTokens: await lpTokenAssociatedAccount.key(),
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
        associatedTokenProgram: SPLToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: web3.SYSVAR_RENT_PUBKEY,
      },
    });
  };
}
