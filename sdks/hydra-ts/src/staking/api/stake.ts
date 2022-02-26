import { Ctx } from "../../types";
import { TOKEN_PROGRAM_ID } from "@project-serum/serum/lib/token-instructions";
import accounts from "../accounts";
import { tryGet } from "../../utils";

export function stake(ctx: Ctx) {
  return async (amount: BigInt) => {
    const acc = accounts(ctx);
    const redeemableMint = await acc.redeemableMint.key();
    const tokenMint = await acc.tokenMint.key();
    const tokenVault = await acc.tokenVault.key();
    const poolState = await acc.poolState.key();
    const userFrom = await tryGet(acc.userToken.key());
    const redeemableTo = await tryGet(acc.userRedeemable.key());
    const userFromAuthority = ctx.wallet.publicKey;
    const tokenProgram = TOKEN_PROGRAM_ID;

    if (!userFrom) {
      throw new Error(
        `Token owner account for tokenMint ${tokenMint} does not exist.`
      );
    }

    if (!redeemableTo) {
      throw new Error(
        `Token owner account for redeemableMint ${redeemableMint} does not exist.`
      );
    }

    await ctx.programs.hydraStaking.rpc.stake(ctx.utils.fromBigInt(amount), {
      accounts: {
        poolState,
        tokenMint,
        redeemableMint,
        userFrom,
        userFromAuthority,
        tokenVault,
        redeemableTo,
        tokenProgram,
      },
    });
  };
}
