import * as anchor from "@project-serum/anchor";
import { BN, Provider } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { Ctx, Option } from "../types";

// TODO:  This should return BigInt as we are going to be using BigInt over BN
//        because wasm requires us to use BigInt and it is therefore available
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

export async function tryGet<T>(fn: Promise<T>): Promise<T | undefined> {
  try {
    return await fn;
  } catch (err) {
    return undefined;
  }
}

// /**
//  * Return the first tokenAccount publicKey for the given mint address or create a new one
//  * @param provider anchor provider
//  * @param mint mintAddress
//  * @returns publicKey
//  */
// export async function getOrCreateOwnerTokenAccount(
//   provider: Provider,
//   mint: PublicKey
// ): Promise<PublicKey> {
//   const account = await getExistingOwnerTokenAccount(provider, mint);

//   if (!account) {
//     // XXX: createTokenAccount requires node to be bundled within the package
//     // We need this functionality but commenting out for now to implement later
//     // return await createTokenAccount(provider, mint, provider.wallet.publicKey);
//   }

//   return account;
// }

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
//
