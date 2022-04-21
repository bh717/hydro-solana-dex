import { PublicKey } from "@solana/web3.js";
import { Ctx } from "../../types";
import { findAssociatedTokenAddress } from "../../utils";
import * as TokenAccount from "../../types/token-account";
import * as TokenMint from "../../types/token-mint";
import { withBump, withTokenMethods } from "./utils";
import { Getter, Parser } from "./types";
import { AsyncKeyAccountLoader } from "./async-key-account-loader";

export const AccountLoader = AsyncKeyAccountLoader;

export * from "./types";

export type KeyOrGetter = Getter<PublicKey> | PublicKey;

export function PDAToken(
  ctx: Ctx,
  programId: PublicKey,
  seeds: (PublicKey | string)[]
) {
  return withTokenMethods(PDA(ctx, programId, seeds, TokenAccount.Parser));
}

export type PDATokenLoader = ReturnType<typeof PDAToken>;

export function Token(ctx: Ctx, getter: KeyOrGetter) {
  return withTokenMethods(AccountLoader(ctx, getter, TokenAccount.Parser));
}

export type TokenLoader = ReturnType<typeof Token>;

export function Mint(ctx: Ctx, getter: KeyOrGetter) {
  return AccountLoader(ctx, getter, TokenMint.Parser);
}

export type MintLoader = ReturnType<typeof Mint>;

export function PDAMint(
  ctx: Ctx,
  programId: PublicKey,
  seeds: (PublicKey | string)[]
) {
  return PDA(ctx, programId, seeds, TokenMint.Parser);
}

export type PDAMintLoader = ReturnType<typeof PDAMint>;

export function AssociatedToken(
  ctx: Ctx,
  mint: PublicKey,
  walletAddress = ctx.wallet.publicKey
) {
  return Token(ctx, () => findAssociatedTokenAddress(walletAddress, mint));
}
export type AssociatedTokenLoader = ReturnType<typeof AssociatedToken>;

export function PDA<T>(
  ctx: Ctx,
  programId: PublicKey,
  seeds: (PublicKey | string)[],
  parser: Parser<T>
) {
  return withBump(
    () => ctx.utils.getPDA(programId, seeds),
    (keyGetter) => AccountLoader<T>(ctx, keyGetter, parser)
  );
}
export type PDALoader = ReturnType<typeof PDA>;
