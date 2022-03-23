import * as anchor from "@project-serum/anchor";
import config from "config-ts/global-config.json";
import assert from "assert";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  BTCD_MINT_AMOUNT,
  SOLD_MINT_AMOUNT,
  USDD_MINT_AMOUNT,
} from "../constants";
import { HydraSDK } from "hydra-ts";
import { PoolFees } from "hydra-ts/src/liquidity-pools/types";
import { BN } from "@project-serum/anchor";

function orderKeyPairs(a: Keypair, b: Keypair) {
  if (a.publicKey.toBuffer().compare(b.publicKey.toBuffer()) > 0) {
    return [b, a];
  }

  return [a, b];
}

describe("hydra-liquidity-pool-hmm", () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  let sdk: HydraSDK;

  let soldMint: PublicKey;
  let usddMint: PublicKey;
  let soldAccount: PublicKey;
  let usddAccount: PublicKey;

  let poolState: PublicKey;
  let tokenXVault: PublicKey;
  let tokenYVault: PublicKey;

  let poolStateBump: number;
  let tokenXVaultBump: number;
  let tokenYVaultBump: number;
  let poolStateAccount: any;

  let poolFees: PoolFees;

  let pyth_product = Keypair.generate();
  let pyth_price = Keypair.generate();

  before(async () => {
    sdk = HydraSDK.createFromAnchorProvider(
      provider,
      config.localnet.programIds
    );

    // Keys will be ordered based on base58 encoding
    const [soldMintPair, usddMintPair] = orderKeyPairs(
      Keypair.generate(),
      Keypair.generate()
    );

    const accounts = await sdk.liquidityPools.accounts.getAccountLoaders(
      soldMintPair.publicKey,
      usddMintPair.publicKey
    );

    [soldMint, soldAccount] = await sdk.common.createMintAndAssociatedVault(
      soldMintPair,
      SOLD_MINT_AMOUNT
    );

    [usddMint, usddAccount] = await sdk.common.createMintAndAssociatedVault(
      usddMintPair,
      USDD_MINT_AMOUNT
    );

    // get the PDA for the PoolState
    poolState = await accounts.poolState.key();
    poolStateBump = await accounts.poolState.bump();
    tokenXVault = await accounts.tokenXVault.key();
    tokenXVaultBump = await accounts.tokenXVault.bump();
    tokenYVault = await accounts.tokenYVault.key();
    tokenYVaultBump = await accounts.tokenYVault.bump();
    poolFees = {
      swapFeeNumerator: 1n,
      swapFeeDenominator: 500n,
      ownerTradeFeeNumerator: 0n,
      ownerTradeFeeDenominator: 0n,
      ownerWithdrawFeeNumerator: 0n,
      ownerWithdrawFeeDenominator: 0n,
      hostFeeNumerator: 0n,
      hostFeeDenominator: 0n,
    };
  });

  it("should initialize a liquidity-pool with hmm/pyth integration", async () => {
    const accounts = await sdk.liquidityPools.accounts.getAccountLoaders(
      soldMint,
      usddMint
    );

    await sdk.liquidityPools.initialize(
      soldMint,
      usddMint,
      poolFees,
      pyth_product.publicKey,
      pyth_price.publicKey
    );
  });
});
