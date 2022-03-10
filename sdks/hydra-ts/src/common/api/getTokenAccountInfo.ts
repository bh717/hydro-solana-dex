import { PublicKey } from "@solana/web3.js";
import { Ctx } from "../..";
import { AccountInfo } from "@solana/web3.js";
import * as TokenAccount from "../../types/token-account";

export function getTokenAccountInfo(ctx: Ctx) {
  return async (
    pubkey: PublicKey
  ): Promise<AccountInfo<TokenAccount.TokenAccount>> => {
    const info = await ctx.provider.connection.getAccountInfoAndContext(pubkey);

    if (!info.value) throw new Error("could not get AccountInfo");

    return { ...info.value, data: TokenAccount.Parser(info.value) };
  };
}
