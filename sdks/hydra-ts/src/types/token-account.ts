import { AccountLayout, u64 } from "@solana/spl-token";
import { AccountInfo, PublicKey } from "@solana/web3.js";
function u64ToBigInt(buffer: Buffer): bigint {
  return BigInt(u64.fromBuffer(buffer).toString());
}
export function Parser(info: AccountInfo<Buffer>): TokenAccount {
  const raw = AccountLayout.decode(info.data);

  return {
    mint: new PublicKey(raw.mint),
    owner: new PublicKey(raw.owner),
    amount: u64ToBigInt(raw.amount),
    delegateOption: raw.delegateOption,
    delegate: new PublicKey(raw.delegate),
    state: raw.state,
    isNativeOption: raw.isNativeOption,
    isNative: u64ToBigInt(raw.isNative),
    delegatedAmount: u64ToBigInt(raw.delegatedAmount),
    closeAuthorityOption: raw.closeAuthorityOption,
    closeAuthority: new PublicKey(raw.closeAuthority),
  };
}

export enum AccountState {
  Uninitialized = 0,
  Initialized = 1,
  Frozen = 2,
}

export type TokenAccount = {
  mint: PublicKey;
  owner: PublicKey;
  amount: bigint;
  delegateOption: 1 | 0;
  delegate: PublicKey;
  state: AccountState;
  isNativeOption: 1 | 0;
  isNative: bigint;
  delegatedAmount: bigint;
  closeAuthorityOption: 1 | 0;
  closeAuthority: PublicKey;
};
