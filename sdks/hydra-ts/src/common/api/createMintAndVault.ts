import {
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { BN } from "@project-serum/anchor";
import * as TokenInstructions from "@project-serum/serum/lib/token-instructions";
import { Ctx } from "../..";

export function createMintAndVault(ctx: Ctx) {
  return async (
    mint: Keypair,
    vault = Keypair.generate(),
    amount: BigInt,
    owner?: PublicKey,
    decimals = 9
  ): Promise<[PublicKey, PublicKey]> => {
    if (owner === undefined) {
      owner = ctx.provider.wallet.publicKey;
    }
    const tx = new Transaction();
    tx.add(
      SystemProgram.createAccount({
        fromPubkey: ctx.provider.wallet.publicKey,
        newAccountPubkey: mint.publicKey,
        space: 82,
        lamports:
          await ctx.provider.connection.getMinimumBalanceForRentExemption(82),
        programId: TokenInstructions.TOKEN_PROGRAM_ID,
      }),
      TokenInstructions.initializeMint({
        mint: mint.publicKey,
        decimals: decimals ?? 0,
        mintAuthority: ctx.provider.wallet.publicKey,
      }),
      SystemProgram.createAccount({
        fromPubkey: ctx.provider.wallet.publicKey,
        newAccountPubkey: vault.publicKey,
        space: 165,
        lamports:
          await ctx.provider.connection.getMinimumBalanceForRentExemption(165),
        programId: TokenInstructions.TOKEN_PROGRAM_ID,
      }),
      TokenInstructions.initializeAccount({
        account: vault.publicKey,
        mint: mint.publicKey,
        owner,
      }),
      TokenInstructions.mintTo({
        mint: mint.publicKey,
        destination: vault.publicKey,
        amount: new BN(amount.toString()),
        mintAuthority: ctx.provider.wallet.publicKey,
      })
    );
    await ctx.provider.send(tx, [mint, vault]);
    return [mint.publicKey, vault.publicKey];
  };
}