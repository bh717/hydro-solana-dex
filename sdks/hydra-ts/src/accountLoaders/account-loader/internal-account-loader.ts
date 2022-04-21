import { AccountInfo, Commitment, PublicKey } from "@solana/web3.js";
import { Ctx } from "../../types";
import { Parser, IAccountLoader, AccountData } from "./types";
import { concat, from, Observable, share, tap } from "rxjs";

// TODO: maintain a list of streams by public key to avoid setting up too many streams
// InternalAccountLoader
// Returns an account loader that is already initialized with a key

export function InternalAccountLoader<T>(
  _ctx: Ctx,
  _key: PublicKey,
  accountParser: Parser<T>
): IAccountLoader<T> {
  async function key() {
    return _key;
  }

  async function info(commitment?: Commitment) {
    let info = await _ctx.connection.getAccountInfo(_key, commitment);
    if (info === null) {
      throw new Error("info couldnt be fetched for " + _key.toString());
    }

    return { ...info, data: accountParser(info) };
  }

  async function isInitialized() {
    try {
      const inf = await info();
      return !!inf;
    } catch (err) {
      return false;
    }
  }

  function onChange(callback: (info: T) => void, commitment: Commitment) {
    let id: number;

    // Hold connection in the closure
    const { connection } = _ctx;

    id = connection.onAccountChange(
      _key,
      (info) => {
        callback(accountParser(info));
      },
      commitment
    );

    return () => {
      if (typeof id !== "undefined") connection.removeAccountChangeListener(id);
    };
  }

  async function getAccountData(
    commitment?: Commitment
  ): Promise<AccountData<T>> {
    let account: AccountInfo<T>;
    try {
      account = await info(commitment);
    } catch (err) {
      account = { data: {} } as AccountInfo<T>;
    }

    return {
      account,
      pubkey: _key,
    };
  }

  function stream(commitment?: Commitment) {
    const currentData$ = from(getAccountData(commitment));
    const changes$ = new Observable<AccountData<T>>((subscriber) => {
      // Listen for account change events
      // Send events to stream
      const id = _ctx.connection.onAccountChange(
        _key,
        (rawAccount: AccountInfo<Buffer> | null) => {
          if (rawAccount) {
            const account = {
              ...rawAccount,
              data: accountParser(rawAccount),
            };
            subscriber.next({ pubkey: _key, account });
          } else {
            subscriber.next();
          }
        },
        commitment
      );

      return () => {
        _ctx.connection.removeAccountChangeListener(id);
      };
    });

    // XXX: Need to cache this Observable so it is a singleton property of this instance
    return concat(
      // first send current data
      currentData$,
      // then send changes
      changes$
    );
  }

  function ready() {
    return Promise.resolve();
  }
  function parser() {
    return accountParser;
  }
  function ctx() {
    return _ctx;
  }

  return {
    key,
    info,
    isInitialized,
    onChange,
    stream,
    ready,
    parser,
    ctx,
  };
}
