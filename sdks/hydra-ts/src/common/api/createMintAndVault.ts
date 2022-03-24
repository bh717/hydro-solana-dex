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
import { createTokenAccount } from ".";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";

async function createAccount(ctx: Ctx, mint: PublicKey) {
  return SystemProgram.createAccount({
    fromPubkey: ctx.provider.wallet.publicKey,
    newAccountPubkey: mint,
    space: 82,
    lamports: await ctx.provider.connection.getMinimumBalanceForRentExemption(
      82
    ),
    programId: TokenInstructions.TOKEN_PROGRAM_ID,
  });
}

// function initMint(mint: PublicKey, decimals: number, owner: PublicKey) {
//   return SPLToken.Token.createInitMintInstruction(
//     SPLToken.TOKEN_PROGRAM_ID, // program id, always token program id
//     mint, // mint account public key
//     decimals, // decimals
//     owner, // mint authority (an auth to mint token)
//     null // freeze authority (we use null first, the auth can let you freeze user's token account)
//   );
// }

function createAssociatedAccountInstruction(
  mint: PublicKey,
  account: PublicKey,
  owner: PublicKey
) {
  return SPLToken.createAssociatedTokenAccountInstruction(
    owner,
    account,
    owner,
    mint,
    SPLToken.TOKEN_PROGRAM_ID,
    SPLToken.ASSOCIATED_TOKEN_PROGRAM_ID
  );
}

function mintToProviderWallet(
  ctx: Ctx,
  mint: PublicKey,
  account: PublicKey,
  amount: bigint
) {
  return SPLToken.createMintToInstruction(
    mint, // mint
    account, // receiver (also need a token account)
    ctx.provider.wallet.publicKey, // mint's authority
    Number(amount), // mint amount, you can pass whatever you want, but it is the smallest unit, so if your decimals is 9, you will need to pass 1e9 to get 1 token
    [], // if mint's authority is a multisig account, then we pass singers into it, for now is empty
    SPLToken.TOKEN_PROGRAM_ID // always token program id
  );
}

// export function createMintAndAssociatedVault(ctx: Ctx) {
//   return async function (
//     mint: Keypair,
//     amount: bigint,
//     owner?: PublicKey,
//     decimals = 6
//   ): Promise<[PublicKey, PublicKey]> {
//     if (owner === undefined) {
//       owner = ctx.provider.wallet.publicKey;
//     }
//
//     const vault = await SPLToken.getAssociatedTokenAddress(
//       mint.publicKey, // mint
//       owner, // token account authority
//       false,
//       TokenInstructions.TOKEN_PROGRAM_ID, // always token program id
//       SPLToken.ASSOCIATED_TOKEN_PROGRAM_ID // always associated token program id
//     );
//
//     const tx = new Transaction();
//     tx.add(
//       await createAccount(ctx, mint.publicKey),
//       initMint(mint.publicKey, decimals, owner),
//       createAssociatedAccountInstruction(mint.publicKey, vault, owner),
//       mintToProviderWallet(ctx, mint.publicKey, vault, amount)
//     );
//     await ctx.provider.send(tx, [mint]);
//     return [mint.publicKey, vault];
//   };
// }

export function createAssociatedAccount(ctx: Ctx) {
  return async function (
    mint: PublicKey,
    owner: Keypair = (ctx.provider.wallet as NodeWallet).payer,
    payer = owner,
    decimals = 6
  ): Promise<PublicKey> {
    if (owner === undefined) {
      owner = (ctx.provider.wallet as NodeWallet).payer;
    }

    const vault = await SPLToken.getAssociatedTokenAddress(
      mint, // mint
      owner.publicKey, // token account authority
      false,
      TokenInstructions.TOKEN_PROGRAM_ID, // always token program id
      SPLToken.ASSOCIATED_TOKEN_PROGRAM_ID // always associated token program id
    );
    // return await createTokenAccount(ctx)(mint, owner);
    const tx = new Transaction();
    tx.add(
      SPLToken.createAssociatedTokenAccountInstruction(
        payer.publicKey, // payer, fund account, like SystemProgram.createAccount's from
        vault, // the ata we calcualted early
        owner.publicKey, // token account owner (which we used to calculate ata)
        mint, // mint (which we used to calculate ata)
        SPLToken.TOKEN_PROGRAM_ID, // always token program id
        SPLToken.ASSOCIATED_TOKEN_PROGRAM_ID // always associated token program id
      )
    );

    tx.feePayer = owner.publicKey;
    await ctx.provider.send(tx, [payer]);
    return vault;
  };
}

// This function comes from serum/common
// It requires an injected private key of the vault
// This doesn't work for situations where we need
// to use cannonical associated accounts based on PDAs
export function createMintAndVault(ctx: Ctx) {
  return async function (
    mint: Keypair,
    vault = Keypair.generate(),
    amount: BigInt,
    owner?: PublicKey,
    decimals = 6
  ): Promise<[PublicKey, PublicKey]> {
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
