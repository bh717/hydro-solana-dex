import { PublicKey } from "@solana/web3.js";

export type PoolState = {
  authority: PublicKey;
  tokenXVault: PublicKey;
  tokenYVault: PublicKey;
  tokenXMint: PublicKey;
  tokenYMint: PublicKey;
  lpTokenMint: PublicKey;
  poolStateBump: number;
  tokenXVaultBump: number;
  tokenYVaultBump: number;
  lpTokenVaultBump: number;
  compensationParameter: number; // Range from (0 - 200) / 100 = c. With only 025 increments
};

export type PoolFees = {
  swapFeeNumerator: bigint;
  swapFeeDenominator: bigint;
  ownerTradeFeeNumerator: bigint;
  ownerTradeFeeDenominator: bigint;
  ownerWithdrawFeeNumerator: bigint;
  ownerWithdrawFeeDenominator: bigint;
  hostFeeNumerator: bigint;
  hostFeeDenominator: bigint;
};
