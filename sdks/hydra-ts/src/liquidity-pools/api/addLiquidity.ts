import { PublicKey } from "@solana/web3.js";
import { Ctx } from "../../types";
import * as accs from "../accounts";
import { toBN, tryGet } from "../../utils";
import { inject } from "../../utils/meta-utils";
import { SystemProgram } from "@solana/web3.js";
import * as SPLToken from "@solana/spl-token";
import { web3 } from "@project-serum/anchor";

export function addLiquidity(ctx: Ctx) {
  return async (
    tokenXMint: PublicKey,
    tokenYMint: PublicKey,
    tokenXMaxAmount: bigint,
    tokenYMaxAmount: bigint,
    expectedLpTokens: bigint
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
          systemProgram: SystemProgram.programId,
          tokenProgram: SPLToken.TOKEN_PROGRAM_ID,
          associatedTokenProgram: SPLToken.ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: web3.SYSVAR_RENT_PUBKEY,
        },
      }
    );
  };
}
