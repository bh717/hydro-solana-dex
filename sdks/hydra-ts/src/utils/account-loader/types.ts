import { AccountInfo, Commitment, PublicKey } from "@solana/web3.js";
import { Observable } from "rxjs";
import { Ctx } from "../..";

export type PDAKey = [PublicKey, number];
export type Getter<T> = () => Promise<T>;
type Unsubscriber = () => void;

export type AccountPubkey<T> = { pubkey: PublicKey; account: AccountInfo<T> };
export type AccountStream<T> = Observable<AccountPubkey<T>>;
export type IAccountLoader<T> = {
  key(): Promise<PublicKey>;
  info(commitment?: Commitment): Promise<AccountInfo<T>>;
  isInitialized(): Promise<boolean>;
  parser(): Parser<T>;
  ctx(): Ctx;
  stream(): AccountStream<T>;
  onChange(callback: (info: T) => void, commitment?: Commitment): Unsubscriber;
};

export type IPDAAccountLoader = {
  bump(): Promise<number>;
};

export type ITokenAccountLoader = {
  balance(commitment?: Commitment): Promise<bigint>;
};

export type Parser<T> = (info: AccountInfo<Buffer>) => T;
