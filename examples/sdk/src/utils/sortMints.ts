import { PublicKey } from "@solana/web3.js";

// Here we sort our mint keys so they can be used to identify which pool we are dealing with
// Before sorting we refer to them as AB after sorting they are referred to as XY
export function sortMints(tokenAMint: PublicKey, tokenBMint: PublicKey) {
  const tokens: [PublicKey, PublicKey] = [tokenAMint, tokenBMint];
  return tokens.sort((tokenA: PublicKey, tokenB: PublicKey) => {
    return tokenA.toBuffer().compare(tokenB.toBuffer());
  });
}

export function sortMintSelector<T>(
  objA: T,
  objB: T,
  selector: (o: T) => PublicKey
): [T, T] {
  return [objA, objB].sort((tokenA: T, tokenB: T) => {
    return selector(tokenA).toBuffer().compare(selector(tokenB).toBuffer());
  }) as [T, T];
}
