import {
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { BN } from "@project-serum/anchor";
import * as TokenInstructions from "@project-serum/serum/lib/token-instructions";
import { Ctx } from "../..";
import * as SPLToken from "@solana/spl-token";

export function createMintAndAssociatedVault(ctx: Ctx) {
  return async (
    mint: Keypair,
    amount: BigInt,
    owner?: PublicKey,
    decimals = 6
  ): Promise<[PublicKey, PublicKey]> => {
    if (owner === undefined) {
      owner = ctx.provider.wallet.publicKey;
    }

    const vault = await SPLToken.Token.getAssociatedTokenAddress(
      SPLToken.ASSOCIATED_TOKEN_PROGRAM_ID, // always associated token program id
      TokenInstructions.TOKEN_PROGRAM_ID, // always token program id
      mint.publicKey, // mint
      owner // token account authority
    );

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
      // init mint
      SPLToken.Token.createInitMintInstruction(
        SPLToken.TOKEN_PROGRAM_ID, // program id, always token program id
        mint.publicKey, // mint account public key
        decimals, // decimals
        owner, // mint authority (an auth to mint token)
        null // freeze authority (we use null first, the auth can let you freeze user's token account)
      ),
      SPLToken.Token.createAssociatedTokenAccountInstruction(
        SPLToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        SPLToken.TOKEN_PROGRAM_ID,
        mint.publicKey,
        vault,
        owner,
        owner
      ),
      SPLToken.Token.createMintToInstruction(
        SPLToken.TOKEN_PROGRAM_ID, // always token program id
        mint.publicKey, // mint
        vault, // receiver (also need a token account)
        ctx.provider.wallet.publicKey, // mint's authority
        [], // if mint's authority is a multisig account, then we pass singers into it, for now is empty
        Number(amount) // mint amount, you can pass whatever you want, but it is the smallest unit, so if your decimals is 9, you will need to pass 1e9 to get 1 token
      )
    );
    await ctx.provider.send(tx, [mint]);
    return [mint.publicKey, vault];
  };
}

export function createMintAndVault(ctx: Ctx) {
  return async (
    mint: Keypair,
    vault = Keypair.generate(),
    amount: BigInt,
    owner?: PublicKey,
    decimals = 6
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
