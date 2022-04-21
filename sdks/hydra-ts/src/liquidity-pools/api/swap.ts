import { PublicKey } from "@solana/web3.js";
import { Ctx } from "../../types";
import * as accs from "../accounts";
import { toBN } from "../../utils";
import { inject } from "../../utils/meta-utils";
import { Token } from "../../accountLoaders/account-loader";
import { web3 } from "@project-serum/anchor";
import { SystemProgram } from "@solana/web3.js";
import * as SPLToken from "@solana/spl-token";

export function swap(ctx: Ctx) {
  return async (
    tokenXMint: PublicKey,
    tokenYMint: PublicKey,
    userFromToken: PublicKey,
    userToToken: PublicKey,
    amountIn: bigint,
    minimumAmountOut: bigint,
    pythPrice?: PublicKey
  ) => {
    const program = ctx.programs.hydraLiquidityPools;
    const accounts = inject(accs, ctx);
    const { tokenXVault, tokenYVault, poolState, lpTokenMint } =
      await accounts.getAccountLoaders(tokenXMint, tokenYMint);

    const info = await Token(ctx, userFromToken).info();
    const userToMint =
      info.data.mint.toString() === tokenXMint.toString()
        ? tokenYMint
        : tokenXMint;

    const swapBase = program.methods
      .swap(toBN(amountIn), toBN(minimumAmountOut))
      .accounts({
        user: ctx.provider.wallet.publicKey,
        tokenXMint,
        tokenYMint,
        poolState: await poolState.key(),
        lpTokenMint: await lpTokenMint.key(),
        userFromToken,
        userToToken,
        userToMint,
        tokenXVault: await tokenXVault.key(),
        tokenYVault: await tokenYVault.key(),
        systemProgram: SystemProgram.programId,
        tokenProgram: SPLToken.TOKEN_PROGRAM_ID,
        associatedTokenProgram: SPLToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: web3.SYSVAR_RENT_PUBKEY,
      });

    const instruction = pythPrice
      ? swapBase.remainingAccounts([
          { pubkey: pythPrice, isSigner: false, isWritable: false },
        ])
      : swapBase;

    await instruction.rpc();
  };
}
