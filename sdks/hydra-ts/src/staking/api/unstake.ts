import { Ctx } from "../../types";
import * as accounts from "../accounts";
import { inject } from "../../utils/meta-utils";
import { SystemProgram } from "@solana/web3.js";
import * as SPLToken from "@solana/spl-token";
import { web3 } from "@project-serum/anchor";

export function unstake(ctx: Ctx) {
  return async (amount: BigInt) => {
    const acc = inject(accounts, ctx);

    const redeemableMint = await acc.redeemableMint.key();
    const tokenMint = await acc.tokenMint.key();
    const tokenVault = await acc.tokenVault.key();
    const poolState = await acc.poolState.key();
    const userTo = await acc.userToken.key();
    const redeemableFrom = await acc.userRedeemable.key();
    const redeemableFromAuthority = ctx.wallet.publicKey;

    await ctx.programs.hydraStaking.rpc.unstake(ctx.utils.toBN(amount), {
      accounts: {
        poolState,
        tokenMint,
        redeemableMint,
        userTo,
        tokenVault,
        redeemableFrom,
        redeemableFromAuthority,
        systemProgram: SystemProgram.programId,
        tokenProgram: SPLToken.TOKEN_PROGRAM_ID,
        associatedTokenProgram: SPLToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: web3.SYSVAR_RENT_PUBKEY,
      },
    });
  };
}
