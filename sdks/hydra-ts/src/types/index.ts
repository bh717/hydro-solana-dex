import { Transaction, PublicKey } from "@solana/web3.js";
import { HydraSDK, IAccountLoader } from "..";
import { createCtxAnchor } from "../ctx";
export type { TokenAccount } from "./token-account";
import { TokenMint } from "./token-mint";
export type { TokenMint };

export type Wallet = {
  signTransaction(tx: Transaction): Promise<Transaction>;
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
  publicKey: PublicKey;
};

export type ProgramIds = {
  // hydra staking program
  hydraBenchmarks: string;
  hydraFarming: string;
  hydraLiquidityPools: string;
  hydraStaking: string;
  redeemableMint: string;
  tokenMint: string;
};

export type Ctx = ReturnType<typeof createCtxAnchor>;

export enum Network {
  MAINNET_BETA = "mainnet-beta",
  TESTNET = "testnet",
  DEVNET = "devnet",
  LOCALNET = "localnet",
}

export type NetworkConfig = {
  programIds: ProgramIds;
};

export type NetworkMap = Record<Network, NetworkConfig>;
export type Asset = {
  chainId: number;
  address: string;
  name: string;
  decimals: number;
  symbol: string;
  logoURI: string;
};

export type PromiseVal<T> = T extends Promise<infer J> ? J : never;
export type LiquidityPoolAccounts = PromiseVal<
  ReturnType<HydraSDK["liquidityPools"]["accounts"]["getAccountLoaders"]>
> & {
  tokenXMint: IAccountLoader<TokenMint>;
  tokenYMint: IAccountLoader<TokenMint>;
};

export type Option<T> = T | undefined;
