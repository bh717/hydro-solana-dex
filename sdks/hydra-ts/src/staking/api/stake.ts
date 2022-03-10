import { Ctx } from "../../types";
import * as accounts from "../accounts";
import { SystemProgram } from "@solana/web3.js";
import { web3 } from "@project-serum/anchor";
import * as SPLToken from "@solana/spl-token";
import { inject } from "../../utils/meta-utils";

export function stake(ctx: Ctx) {
  return async (amount: BigInt) => {
    const acc = inject(accounts, ctx);
    const redeemableMint = await acc.redeemableMint.key();
    const tokenMint = await acc.tokenMint.key();
    const tokenVault = await acc.tokenVault.key();
    const poolState = await acc.poolState.key();
    const userFrom = await acc.userToken.key();
    const redeemableTo = await acc.userRedeemable.key();
    const userFromAuthority = ctx.wallet.publicKey;

    await ctx.programs.hydraStaking.rpc.stake(ctx.utils.fromBigInt(amount), {
      accounts: {
        poolState,
        tokenMint,
        redeemableMint,
        userFrom,
        userFromAuthority,
        tokenVault,
        redeemableTo,
        systemProgram: SystemProgram.programId,
        tokenProgram: SPLToken.TOKEN_PROGRAM_ID,
        associatedTokenProgram: SPLToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: web3.SYSVAR_RENT_PUBKEY,
      },
    });
  };
}
