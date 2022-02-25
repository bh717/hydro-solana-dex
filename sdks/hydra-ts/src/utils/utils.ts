import * as anchor from "@project-serum/anchor";
import { BN, Provider } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

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
