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

export async function getTokenBalance(provider: Provider, pubkey: PublicKey) {
  return new BN(
    (await provider.connection.getTokenAccountBalance(pubkey)).value.amount
  );
}

/**
 * Gets a PDA derived based on seed
 * @param programId ProgramID to derive this key from
 * @param seeds array of seeds
 * @returns
 */
export async function getPDA(
  programId: PublicKey,
  seeds: (PublicKey | string)[]
) {
  const [pubkey, bump] = await anchor.web3.PublicKey.findProgramAddress(
    seeds.map((seed) => {
      if (typeof seed === "string") return anchor.utils.bytes.utf8.encode(seed);
      return seed.toBuffer();
    }),
    programId
  );
  return [pubkey, bump] as [typeof pubkey, typeof bump];
}

export function toBigInt(amount: BN): BigInt {
  return BigInt(amount.toString());
}

export function fromBigInt(amount: BigInt): BN {
  return new BN(amount.toString());
}

/**
 * Return the first tokenAccount publicKey for the given mint address
 * @param provider anchor provider
 * @param mint mintAddress
 * @returns publicKey
 */
export async function getOwnerTokenAccount(
  provider: Provider,
  mint: PublicKey
) {
  const { pubkey } = (
    await provider.connection.getTokenAccountsByOwner(
      provider.wallet.publicKey,
      {
        mint,
      }
    )
  ).value[0];
  return pubkey;
}
