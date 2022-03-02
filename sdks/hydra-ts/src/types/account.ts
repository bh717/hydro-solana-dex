import { Commitment } from "@solana/web3.js";
import { AccountInfo } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { Ctx, Option } from ".";

type PDAKey = [PublicKey, number];
type Keyish = PDAKey | PublicKey;
type MaybeKeyish = Option<Keyish>;

export class Account {
  constructor(
    private _keyishPromise: Option<MaybeKeyish> | Promise<MaybeKeyish>,
    private ctx: Ctx
  ) {}

  async key(): Promise<PublicKey> {
    const keyish = await Promise.resolve(this._keyishPromise);
    if (Array.isArray(keyish)) {
      return keyish[0];
    }
    if (keyish === undefined) throw new Error("Key was undefined after await");
    return keyish;
  }

  async bump(): Promise<number> {
    const keyish = await Promise.resolve(this._keyishPromise);
    if (Array.isArray(keyish)) {
      return keyish[1];
    }
    throw new Error("Cannot call bump on non PDA account");
  }

  async info(commitment?: Commitment) {
    const key = await this.key();
    return await this.ctx.connection.getAccountInfo(key, commitment);
  }

  async bal(commitment?: Commitment) {
    const key = await this.key();
    const balance = await this.ctx.connection.getTokenAccountBalance(
      key,
      commitment
    );
    balance.value;
    return BigInt(balance.value.amount);
  }

  onChange(
    callback: (info: AccountInfo<Buffer>) => void,
    commitment?: Commitment
  ) {
    const { connection } = this.ctx;
    let id: number;
    const resolvedKey = Promise.resolve(this.key());
    resolvedKey.then((key) => {
      if (!key) return;
      id = connection.onAccountChange(key, callback, commitment);
    });
    return () => {
      resolvedKey.then(() => {
        if (typeof id !== "undefined")
          connection.removeAccountChangeListener(id);
      });
    };
  }
}
