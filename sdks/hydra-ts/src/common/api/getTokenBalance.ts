import { PublicKey } from "@solana/web3.js";
import { Ctx } from "../..";

export function getTokenBalance(ctx: Ctx) {
  return async (pubkey: PublicKey) => {
    return BigInt(
      (await ctx.provider.connection.getTokenAccountBalance(pubkey)).value
        .amount
    );
  };
}
