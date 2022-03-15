import { PublicKey } from "@solana/web3.js";

export type PoolState = {
  authority: PublicKey;
  tokenVault: PublicKey;
  tokenMint: PublicKey;
  tokenMintDecimals: number;
  redeemableMint: PublicKey;
  poolStateBump: number;
  tokenVaultBump: number;
};
