import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Program, Provider } from "@project-serum/anchor";
import { HydraStaking } from "target/types/hydra_staking";

export type Wallet = {
  publicKey: PublicKey;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
};

export type ProgramIds = {
  hydraStaking: string;
};

export type Ctx = {
  wallet: Wallet;
  connection: Connection;
  provider: Provider;
  programs: {
    hydraStaking: Program<HydraStaking>;
  };
};
