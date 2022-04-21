import { PublicKey, AccountInfo } from "@solana/web3.js";
import { Ctx } from "../..";
import * as AccountLoader from "../../accountLoaders/account-loader";

type Parser<T> = (info: AccountInfo<Buffer>) => T;
export function toAccountLoader<T>(ctx: Ctx) {
  return (parser: Parser<T>) => (key: PublicKey) =>
    AccountLoader.AccountLoader(ctx, key, parser);
}

export function toAssociatedTokenAccount(ctx: Ctx) {
  return (mint: PublicKey, walletAddress = ctx.wallet.publicKey) =>
    AccountLoader.AssociatedToken(ctx, mint, walletAddress);
}

export function toMintAccountLoader(ctx: Ctx) {
  return (key: PublicKey) => AccountLoader.Mint(ctx, key);
}

export function toTokenAccountLoader(ctx: Ctx) {
  return (key: PublicKey) => AccountLoader.Token(ctx, key);
}

export function toStream(_: Ctx) {
  return <T extends AccountLoader.IAccountLoader<any>>(loader: T) =>
    loader.changes();
}
