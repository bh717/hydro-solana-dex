import { PublicKey } from "@solana/web3.js";
import {
  IAccountLoader,
  Getter,
  PDAKey,
  IPDAAccountLoader,
  ITokenAccountLoader,
} from "./types";

export function withBump<T extends IAccountLoader<any>>(
  getter: Getter<PDAKey>,
  getLoader: (getter: Getter<PublicKey>) => T
): T & IPDAAccountLoader {
  const keyGetter = async () => {
    const [key] = await getter();
    return key;
  };
  const loader = getLoader(keyGetter);
  return {
    ...loader,
    async bump() {
      const [, bump] = await getter();
      return bump;
    },
  };
}

export function withBalance<T extends IAccountLoader<any>>(
  loader: T
): T & ITokenAccountLoader {
  return {
    ...loader,

    async balance(commitment) {
      const bal = await loader
        .ctx()
        .connection.getTokenAccountBalance(await loader.key(), commitment);

      return BigInt(bal.value.amount);
    },
  };
}
