import { AccountInfo, Commitment, PublicKey } from "@solana/web3.js";
import { Ctx } from "../../types";
import { findAssociatedTokenAddress } from "..";
import * as TokenAccount from "../../types/token-account";
import * as TokenMint from "../../types/token-mint";
import { Observable, Subject } from "rxjs";
import { withBump, withTokenMethods } from "./utils";
import { Getter, Parser, IAccountLoader, AccountData } from "./types";
export * from "./types";
type KeyOrGetter = Getter<PublicKey> | PublicKey;

// TODO: maintain a list of streams by public key to avoid setting up too many streams

export function AccountLoader<T>(
  ctx: Ctx,
  getter: KeyOrGetter,
  accountParser: Parser<T>
): IAccountLoader<T> {
  const getKey =
    typeof getter === "function" ? getter : () => Promise.resolve(getter);

  async function info(commitment?: Commitment) {
    const key = await getKey();

    let info = await ctx.connection.getAccountInfo(key, commitment);
    if (info === null) {
      throw new Error("info couldnt be fetched for " + key.toString());
    }

    return { ...info, data: accountParser(info) };
  }

  async function key() {
    return await getKey();
  }

  async function isInitialized() {
    const inf = await info();
    return !!inf;
  }

  return {
    key,
    info,
    isInitialized,
    onChange(callback, commitment) {
      let id: number;

      // Hold connection in the closure
      const { connection } = ctx;

      getKey().then((key) => {
        if (!key) return;
        id = connection.onAccountChange(
          key,
          (info) => {
            callback(accountParser(info));
          },
          commitment
        );
      });

      return () => {
        getKey().then(() => {
          if (typeof id !== "undefined")
            connection.removeAccountChangeListener(id);
        });
      };
    },
    stream(commitment?: Commitment): Observable<AccountData<T>> {
      return new Observable((subscriber) => {
        console.log("Getting initial stream state");
        info(commitment)
          .then(async (account) => {
            if (account) {
              const pubkey = await key();
              console.log("Received account from initial info()", `${pubkey}`);
              subscriber.next({
                account,
                pubkey,
              });
            }
          })
          .catch(async (err) => {
            console.log(err.message);
            subscriber.next();
          });
        let id: number;

        key().then((pubkey) => {
          id = ctx.connection.onAccountChange(
            pubkey,
            async (rawAccount: AccountInfo<Buffer> | null) => {
              console.log("Stream received data..." + rawAccount);

              if (rawAccount) {
                const account = {
                  ...rawAccount,
                  data: accountParser(rawAccount),
                };
                const pubkey = await key();

                console.log("Stream received account update", {
                  pubkey,
                  account,
                });
                subscriber.next({ pubkey, account });
              } else {
                subscriber.next();
              }
            }
          );
        });

        return () => {
          key().then(() => {
            ctx.connection.removeAccountChangeListener(id);
          });
        };
      });
    },
    parser() {
      return accountParser;
    },
    ctx() {
      return ctx;
    },
  };
}

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
