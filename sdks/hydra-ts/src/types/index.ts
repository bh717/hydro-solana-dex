import { Transaction, PublicKey } from "@solana/web3.js";
import { createCtxAnchor } from "../ctx";
export * from "./account";

export type SPLAccountInfo = {
  address: PublicKey;
  owner: PublicKey;
  mint: PublicKey;
  amount: BigInt;
};
export type Wallet = {
  signTransaction(tx: Transaction): Promise<Transaction>;
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
  publicKey: PublicKey;
};

export type ProgramIds = {
  // hydra staking program
  hydraStaking: string;
  tokenMint: string;
  redeemableMint: string;
};

export type Ctx = ReturnType<typeof createCtxAnchor>;

export type Network = "mainnet" | "testnet" | "devnet" | "localnet";

export type NetworkConfig = {
  programIds: ProgramIds;
};

export type NetworkMap = Record<Network, NetworkConfig>;

export type Option<T> = T | undefined;
