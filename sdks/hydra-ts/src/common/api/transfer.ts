import {
  Keypair,
  PublicKey,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
import * as TokenInstructions from "@project-serum/serum/lib/token-instructions";
import { NodeWallet } from "@project-serum/common";
import { Ctx } from "../..";

export function transfer(ctx: Ctx) {
  return async (
    from: PublicKey,
    to: PublicKey,
    amount: number | bigint,
    owner = ctx.provider.wallet.publicKey,
    payer: Keypair = (ctx.provider.wallet as NodeWallet).payer as any as Keypair
  ): Promise<TransactionSignature> => {
    const tx = new Transaction();
    tx.add(
      TokenInstructions.transfer({
        source: from,
        destination: to,
        amount: Number(amount),
        owner,
      })
    );
    let txhash = await ctx.provider.send(tx, [payer]);
    return txhash;
  };
}
