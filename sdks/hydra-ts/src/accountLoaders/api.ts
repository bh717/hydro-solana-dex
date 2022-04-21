import { PublicKey, AccountInfo } from "@solana/web3.js";
import { Ctx } from "..";
import * as AccountLoader from "../libs/account-loader";

type Parser<T> = (info: AccountInfo<Buffer>) => T;

// helpers for working with accounts

// client.accountLoaders.account(parser)(key)
export function account<T>(ctx: Ctx) {
  return (parser: Parser<T>) => (key: PublicKey) =>
    AccountLoader.AccountLoader(ctx, key, parser);
}

// client.accountLoaders.associatedToken(pubkey)
export function associatedToken(ctx: Ctx) {
  return (mint: PublicKey, walletAddress = ctx.wallet.publicKey) =>
    AccountLoader.AssociatedToken(ctx, mint, walletAddress);
}

// client.accountLoaders.mint(pubkey)
export function mint(ctx: Ctx) {
  return (key: PublicKey) => AccountLoader.Mint(ctx, key);
}

// client.accountLoaders.token(pubkey)
export function token(ctx: Ctx) {
  return (key: PublicKey) => AccountLoader.Token(ctx, key);
}

// client.accountLoaders.mintOfToken(key)
export function mintOfToken(ctx: Ctx) {
  return async (loader: AccountLoader.TokenLoader) => {
    return AccountLoader.Mint(ctx, (await loader.info()).data.mint);
  };
}
