import { Ctx } from "../../types";
import { TOKEN_PROGRAM_ID } from "@project-serum/serum/lib/token-instructions";
import accounts from "../accounts";
import { tryGet } from "../../utils";

export function unstake(ctx: Ctx) {
  return async (amount: BigInt) => {
    const acc = accounts(ctx);

    const redeemableMint = await acc.redeemableMint.key();
    const tokenMint = await acc.tokenMint.key();
    const tokenVault = await acc.tokenVault.key();
    const poolState = await acc.poolState.key();
    const userTo = await tryGet(acc.userToken.key());
    const redeemableFrom = await tryGet(acc.userRedeemable.key());
    const redeemableFromAuthority = ctx.wallet.publicKey;

    if (!userTo) {
      throw new Error(
        `Token owner account for tokenMint ${tokenMint} does not exist.`
      );
    }

    if (!redeemableFrom) {
      throw new Error(
        `Token owner account for redeemableMint ${redeemableMint} does not exist.`
      );
    }

    await ctx.programs.hydraStaking.rpc.unstake(ctx.utils.fromBigInt(amount), {
      accounts: {
        poolState,
        tokenMint,
        redeemableMint,
        userTo,
        tokenVault,
        redeemableFrom,
        redeemableFromAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });
  };
}
