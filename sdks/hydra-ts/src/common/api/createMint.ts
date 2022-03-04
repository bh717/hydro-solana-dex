import { PublicKey, Keypair, Transaction } from "@solana/web3.js";
import { Ctx } from "../..";
import { createMintInstructions } from "./utils";

export function createMint(ctx: Ctx) {
  return async (
    mint = Keypair.generate(),
    authority?: PublicKey,
    decimals = 9
  ): Promise<PublicKey> => {
    if (authority === undefined) {
      authority = ctx.provider.wallet.publicKey;
    }
    const instructions = await createMintInstructions(
      ctx.provider,
      authority,
      mint.publicKey,
      decimals
    );

    const tx = new Transaction();
    tx.add(...instructions);

    await ctx.provider.send(tx, [mint]);

    return mint.publicKey;
  };
}
