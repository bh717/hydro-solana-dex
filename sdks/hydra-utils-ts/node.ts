import * as Buffer from "buffer";
import { URL } from "url";
import * as fs from "fs";
import * as anchor from "@project-serum/anchor";
import { Provider } from "@project-serum/anchor";
import {
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  TransactionSignature,
} from "@solana/web3.js";
import { BN } from "@project-serum/anchor";
import { TokenInstructions } from "@project-serum/serum";
import { createMintInstructions, NodeWallet } from "@project-serum/common";

type PathLike = string | Buffer | URL;

export async function loadKey(path: PathLike): Promise<anchor.web3.Keypair> {
  let rawdata = fs.readFileSync(path);
  let keydata = JSON.parse(rawdata.toString());
  return anchor.web3.Keypair.fromSecretKey(new Uint8Array(keydata));
}

export async function createMint(
  provider: Provider,
  mint = Keypair.generate(),
  authority?: PublicKey,
  decimals = 9
): Promise<PublicKey> {
  if (authority === undefined) {
    authority = provider.wallet.publicKey;
  }
  const instructions = await createMintInstructions(
    provider,
    authority,
    mint.publicKey,
    decimals
  );

  const tx = new Transaction();
  tx.add(...instructions);

  await provider.send(tx, [mint]);

  return mint.publicKey;
}

export async function transfer(
  provider: Provider,
  source: any,
  destination: any,
  amount: any
): Promise<TransactionSignature> {
  const tx = new Transaction();
  tx.add(
    TokenInstructions.transfer({
      source: source,
      destination: destination,
      amount: amount,
      owner: provider.wallet.publicKey,
    })
  );
  let txhash = await provider.send(tx, [(provider.wallet as NodeWallet).payer]);
  return txhash;
}

export async function createMintAndVault(
  provider: Provider,
  mint: Keypair,
  vault = Keypair.generate(),
  amount: BN,
  owner?: PublicKey,
  decimals = 9
): Promise<[PublicKey, PublicKey]> {
  if (owner === undefined) {
    owner = provider.wallet.publicKey;
  }
  const tx = new Transaction();
  tx.add(
    SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey: mint.publicKey,
      space: 82,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(82),
      programId: TokenInstructions.TOKEN_PROGRAM_ID,
    }),
    TokenInstructions.initializeMint({
      mint: mint.publicKey,
      decimals: decimals ?? 0,
      mintAuthority: provider.wallet.publicKey,
    }),
    SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey: vault.publicKey,
      space: 165,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(
        165
      ),
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
      amount,
      mintAuthority: provider.wallet.publicKey,
    })
  );
  await provider.send(tx, [mint, vault]);
  return [mint.publicKey, vault.publicKey];
}
