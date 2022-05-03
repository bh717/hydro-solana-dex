import { Network, getAsset } from "hydra-ts";
import { PublicKey } from "@solana/web3.js";
import { PoolFees } from "hydra-ts/src/liquidity-pools/types";

export type InitializeConfig = {
  tokens: InitializeTokensConfig;
  pools: InitializePoolConfig;
  demoAccount: InitializeTraderConfig;
};

export type InitializeTokensConfig = Array<{ symbol: string; amount: bigint }>;

export type PoolConfig = {
  tokenX: string;
  tokenY: string;
  tokenXAmount: bigint;
  tokenYAmount: bigint;
  fees: PoolFees;
};
export type InitializePoolConfig = Array<PoolConfig>;
export function getMintKeyFromSymbol(symbol: string, network: Network) {
  const asset = getAsset(symbol, network);
  if (!asset.address) throw new Error("asset.adderss cannot be found!");
  return new PublicKey(asset.address);
}

export type InitializeTraderConfig = {
  demoAccountKey: string;
  tokens: Array<{ symbol: string; amount: bigint }>;
};
