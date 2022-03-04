import { PublicKey, RpcResponseAndContext } from "@solana/web3.js";
import { Ctx, SPLAccountInfo } from "../..";
import { decodeAccountInfo, decodeTokenAccountInfo } from "./utils";
import { AccountInfo } from "@solana/web3.js";
import { Observable, combineLatest } from "rxjs";

export function getTokenAccountInfo(ctx: Ctx) {
  return async (pubkey: PublicKey): Promise<SPLAccountInfo> => {
    const info = await ctx.provider.connection.getAccountInfoAndContext(pubkey);

    if (!info.value) throw new Error("could not get AccountInfo");

    return decodeTokenAccountInfo(pubkey, info.value);
  };
}

export function getAccountInfoStream(ctx: Ctx) {
  return function (pubkey: PublicKey) {
    return new Observable<SPLAccountInfo>((subscriber) => {
      const getInfo = getTokenAccountInfo(ctx);
      getInfo(pubkey).then((info: SPLAccountInfo) => {
        if (info) subscriber.next(info);
      });

      const id = ctx.connection.onAccountChange(
        pubkey,
        (info: AccountInfo<Buffer> | null) => {
          if (info) subscriber.next(decodeAccountInfo(info));
        }
      );

      return () => {
        ctx.connection.removeAccountChangeListener(id);
      };
    });
  };
}

export function getTokenAccountInfoStream(ctx: Ctx) {
  return function (pubkey: PublicKey) {
    return new Observable<SPLAccountInfo>((subscriber) => {
      const handler = (info: AccountInfo<Buffer> | null) => {
        console.log(
          `getTokenAccountInfoStream::handler`,
          pubkey.toString(),
          info
        );
        if (info) subscriber.next(decodeTokenAccountInfo(pubkey, info));
      };

      ctx.connection.getAccountInfo(pubkey).then(handler);

      const id = ctx.connection.onAccountChange(pubkey, handler);

      return () => {
        ctx.connection.removeAccountChangeListener(id);
      };
    });
  };
}

export function getAccountInfoStreams(ctx: Ctx) {
  return function <T>(
    pubkeys: T
  ): Observable<{ [K in keyof T]: AccountInfo<Buffer> }> {
    const entries = Object.entries(pubkeys);
    const toStream = getAccountInfoStream(ctx);
    const streams = entries.map(([k, pk]) => {
      return [k, toStream(pk)];
    });

    const combiner: { [K in keyof T]: Observable<AccountInfo<Buffer>> } =
      Object.fromEntries(streams);

    // create a joint stream that emits all changes
    const combined$ = combineLatest(combiner) as Observable<{
      [K in keyof T]: AccountInfo<Buffer>;
    }>;
    return combined$;
  };
}

export function getTokenAccountInfoStreams(ctx: Ctx) {
  return function <T>(
    pubkeys: T
  ): Observable<{ [K in keyof T]: SPLAccountInfo }> {
    const entries = Object.entries(pubkeys);
    const toStream = getTokenAccountInfoStream(ctx);
    const streams = entries.map(([k, pk]) => {
      return [k, toStream(pk)];
    });

    const combiner: { [K in keyof T]: Observable<SPLAccountInfo> } =
      Object.fromEntries(streams);

    // create a joint stream that emits all changes
    const combined$ = combineLatest(combiner) as Observable<{
      [K in keyof T]: SPLAccountInfo;
    }>;
    return combined$;
  };
}
