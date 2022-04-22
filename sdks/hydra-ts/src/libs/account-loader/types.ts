import { AccountInfo, Commitment, PublicKey } from "@solana/web3.js";
import { Observable } from "rxjs";
import { MintLoader } from ".";
import { Ctx } from "../..";

export type PDAKey = [PublicKey, number];
export type Getter<T> = () => Promise<T>;
type Unsubscriber = () => void;
export type ReadyObservable<T> = Observable<T> & {
  ready: () => Promise<Observable<T>>;
};
export type AccountData<T> = { pubkey: PublicKey; account: AccountInfo<T> };
export type AccountStream<T> = Observable<AccountData<T>>;
export type IAccountLoader<T> = {
  key(): Promise<PublicKey>;
  ready(): Promise<void>;
  info(commitment?: Commitment): Promise<AccountInfo<T>>;
  isInitialized(): Promise<boolean>;
  parser(): Parser<T>;
  ctx(): Ctx;
  stream(commitment?: Commitment): Observable<AccountData<T> | undefined>;
  onChange(callback: (info: T) => void, commitment?: Commitment): Unsubscriber;
};

export type IPDAAccountLoader = {
  bump(): Promise<number>;
};

export type ITokenAccountLoader = {
  balance(commitment?: Commitment): Promise<bigint>;
  mint(): Promise<MintLoader>;
};

export type Parser<T> = (info: AccountInfo<Buffer>) => T;
