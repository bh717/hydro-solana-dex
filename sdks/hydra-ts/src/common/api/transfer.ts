import { PublicKey, Transaction, TransactionSignature } from "@solana/web3.js";
import * as TokenInstructions from "@project-serum/serum/lib/token-instructions";
import { NodeWallet } from "@project-serum/common";
import { Ctx } from "../..";

export function transfer(ctx: Ctx) {
  return async (
    source: PublicKey,
    destination: PublicKey,
    amount: number | bigint
  ): Promise<TransactionSignature> => {
    const tx = new Transaction();
    tx.add(
      TokenInstructions.transfer({
        source: source,
        destination: destination,
        amount: amount,
        owner: ctx.provider.wallet.publicKey,
      })
    );
    let txhash = await ctx.provider.send(tx, [
      (ctx.provider.wallet as NodeWallet).payer,
    ]);
    return txhash;
  };
}