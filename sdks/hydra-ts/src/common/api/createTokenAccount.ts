import { PublicKey, Keypair, Transaction } from "@solana/web3.js";
import { Ctx } from "../..";
import { createTokenAccountInstrs } from "./utils";

export function createTokenAccount(ctx: Ctx) {
  return async (mint: PublicKey, owner: PublicKey): Promise<PublicKey> => {
    const vault = Keypair.generate();
    const tx = new Transaction();
    tx.add(
      ...(await createTokenAccountInstrs(
        ctx.provider,
        vault.publicKey,
        mint,
        owner
      ))
    );
    await ctx.provider.send(tx, [vault]);
    return vault.publicKey;
  };
}
