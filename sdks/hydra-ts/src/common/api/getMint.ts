import { PublicKey } from "@solana/web3.js";
import { Ctx } from "../..";
import * as SPLToken from "@solana/spl-token";

function parseMintInfo(info: SPLToken.MintInfo) {
  return {
    ...info,
    supply: BigInt(info.supply.toString()),
  };
}

export function getMint(ctx: Ctx) {
  return async function (pubkey: PublicKey) {
    const token = new SPLToken.Token(
      ctx.connection,
      pubkey,
      SPLToken.TOKEN_PROGRAM_ID,
      null as any
    );
    const tokenInfo = await token.getMintInfo();
    return parseMintInfo(tokenInfo);
  };
}