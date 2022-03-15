import { Keypair, PublicKey } from "@solana/web3.js";
import {
  LP_TOKEN_VAULT_SEED,
  POOL_STATE_SEED,
  TOKEN_VAULT_SEED,
} from "../config/constants";
import { PoolState } from "./types";
import { Ctx } from "../types";
import * as AccountLoader from "../utils/account-loader";
import { inject } from "../utils/meta-utils";
import { tryGet } from "../utils";

export const getAccountLoaders =
  (ctx: Ctx) => async (lpTokenMint: PublicKey) => {
    const poolStateLoader = LOADERS.poolState(ctx)(lpTokenMint);
    const poolStateInfo = await tryGet(poolStateLoader.info());

    if (!poolStateInfo) {
      throw new Error("Pool must be been initialized");
    }

    const { tokenXMint, tokenYMint } = poolStateInfo.data;

    const loaders = await getInitAccountLoaders(ctx)(
      tokenXMint,
      tokenYMint,
      lpTokenMint
    );
    return {
      ...loaders,
      poolState: poolStateLoader,
    };
  };

export const getInitAccountLoaders =
  (ctx: Ctx) =>
  async (
    tokenXMint: PublicKey,
    tokenYMint: PublicKey,
    lpTokenMint: PublicKey = Keypair.generate().publicKey
  ) => {
    const accounts = inject(LOADERS, ctx);
    const poolState = accounts.poolState(lpTokenMint);
    const tokenXVault = accounts.tokenXVault(tokenXMint, lpTokenMint);
    const tokenYVault = accounts.tokenYVault(tokenYMint, lpTokenMint);
    const lpTokenVault = accounts.lpTokenVault(
      await poolState.key(),
      lpTokenMint
    );
    const userTokenX = accounts.userXToken(tokenXMint);
    const userTokenY = accounts.userYToken(tokenYMint);
    const lpTokenAssociatedAccount =
      accounts.lpTokenAssociatedAccount(lpTokenMint);
    return {
      poolState,
      tokenXVault,
      tokenYVault,
      lpTokenVault,
      userTokenX,
      userTokenY,
      lpTokenAssociatedAccount,
    };
  };

export const poolState = (ctx: Ctx) => (lpTokenMint: PublicKey) => {
  const programId = ctx.programs.hydraLiquidityPools.programId;
  const seeds = [POOL_STATE_SEED, lpTokenMint];
  const parser = ctx.getParser<PoolState>(
    ctx.programs.hydraLiquidityPools,
    "PoolState"
  );

  return AccountLoader.PDA(ctx, programId, seeds, parser);
};

export const tokenXVault =
  (ctx: Ctx) => (tokenXMint: PublicKey, lpTokenMint: PublicKey) => {
    const programId = ctx.programs.hydraLiquidityPools.programId;
    const seeds = [TOKEN_VAULT_SEED, tokenXMint, lpTokenMint];
    return AccountLoader.PDAToken(programId, seeds, ctx);
  };

export const tokenYVault =
  (ctx: Ctx) => (tokenYMint: PublicKey, lpTokenMint: PublicKey) => {
    const programId = ctx.programs.hydraLiquidityPools.programId;
    const seeds = [TOKEN_VAULT_SEED, tokenYMint, lpTokenMint];
    return AccountLoader.PDAToken(programId, seeds, ctx);
  };

export const lpTokenVault =
  (ctx: Ctx) => (poolState: PublicKey, lpTokenMint: PublicKey) => {
    const programId = ctx.programs.hydraLiquidityPools.programId;
    const seeds = [LP_TOKEN_VAULT_SEED, poolState, lpTokenMint];
    return AccountLoader.PDAToken(programId, seeds, ctx);
  };

export const userXToken = (ctx: Ctx) => (tokenXMint: PublicKey) => {
  return AccountLoader.AssociatedToken(ctx, tokenXMint);
};

export const userYToken = (ctx: Ctx) => (tokenYMint: PublicKey) => {
  return AccountLoader.AssociatedToken(ctx, tokenYMint);
};

export const lpTokenAssociatedAccount =
  (ctx: Ctx) => (lpTokenMint: PublicKey) => {
    return AccountLoader.AssociatedToken(ctx, lpTokenMint);
  };

const LOADERS = {
  poolState,
  tokenXVault,
  tokenYVault,
  lpTokenVault,
  userXToken,
  userYToken,
  lpTokenAssociatedAccount,
};
