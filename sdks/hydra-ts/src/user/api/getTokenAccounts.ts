import { Provider } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { Ctx } from "../..";
import { isDefaultProvider } from "../../utils";

const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

export function getTokenAccounts(ctx: Ctx) {
  return async (mint?: PublicKey) => {
    if (isDefaultProvider(ctx.provider)) {
      return [];
    }

    const filter = mint
      ? { mint }
      : {
          programId: TOKEN_PROGRAM_ID,
        };

    const accounts = await ctx.provider.connection.getTokenAccountsByOwner(
      ctx.provider.wallet.publicKey,
      filter
    );

    return accounts.value.map(({ pubkey }) => pubkey);
  };
}

export function getTokenAccount(ctx: Ctx) {
  return async function (mint: PublicKey) {
    if (isDefaultProvider(ctx.provider)) {
      return [];
    }
  };
}
