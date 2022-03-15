import * as anchor from "@project-serum/anchor";
import { BN, Provider } from "@project-serum/anchor";
import {
  Keypair,
  PublicKey,
  Signer,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { Option } from "../types";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as SPLToken from "@solana/spl-token";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";

const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID: PublicKey = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

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

export function toBN(amount: BigInt): BN {
  return new BN(amount.toString());
}

export async function tryGet<T>(fn: Promise<T>): Promise<T | undefined> {
  try {
    return await fn;
  } catch (err) {
    return undefined;
  }
}

export function isDefaultProvider(provider: Provider) {
  // TODO: use constant
  return (
    provider.wallet.publicKey.toString() === "11111111111111111111111111111111"
  );
}

// Testing utility to stringify public keys
export function stringifyProps<
  T extends Record<string, { toString: Function }>
>(obj: T): { [K in keyof T]: string } {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v.toString()])
  ) as { [K in keyof T]: string };
}

/**
 * Return the first tokenAccount publicKey for the given mint address
 * @param provider anchor provider
 * @param mint mintAddress
 * @returns publicKey
 */
export async function getExistingOwnerTokenAccount(
  provider: Provider,
  mint: PublicKey
): Promise<Option<PublicKey>> {
  const account = await provider.connection.getTokenAccountsByOwner(
    provider.wallet.publicKey,
    {
      mint,
    }
  );
  const accounts = account.value;
  if (accounts.length > 0) {
    return accounts[0].pubkey;
  }
  return undefined;
}

export async function findAssociatedTokenAddress(
  walletAddress: PublicKey,
  tokenMintAddress: PublicKey
): Promise<PublicKey> {
  return await SPLToken.Token.getAssociatedTokenAddress(
    SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID, // always associated token program id
    TOKEN_PROGRAM_ID, // always token program id
    tokenMintAddress, // mint
    walletAddress // token account authority
  );
}
