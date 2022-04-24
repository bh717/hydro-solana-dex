import { POOL_STATE_SEED, TOKEN_VAULT_SEED } from "../config/constants";
import { Ctx } from "../types";
import * as AccountLoader from "../libs/account-loader";
import { PoolState } from "./types/pool-state";

export const tokenMint = (ctx: Ctx) => {
  return AccountLoader.Mint(ctx, ctx.getKey("tokenMint"));
};

export const redeemableMint = (ctx: Ctx) => {
  return AccountLoader.Mint(ctx, ctx.getKey("redeemableMint"));
};

export const userToken = (ctx: Ctx) => {
  return AccountLoader.AssociatedToken(ctx, ctx.getKey("tokenMint"));
};

export const userRedeemable = (ctx: Ctx) => {
  return AccountLoader.AssociatedToken(ctx, ctx.getKey("redeemableMint"));
};

export const tokenVault = (ctx: Ctx) => {
  const programId = ctx.programs.hydraStaking.programId;

  const seeds = [
    TOKEN_VAULT_SEED,
    ctx.getKey("tokenMint"),
    ctx.getKey("redeemableMint"),
  ];
  return AccountLoader.PDAToken(ctx, programId, seeds);
};

export const poolState = (ctx: Ctx) => {
  const programId = ctx.programs.hydraStaking.programId;
  const seeds = [
    POOL_STATE_SEED,
    ctx.getKey("tokenMint"),
    ctx.getKey("redeemableMint"),
  ];
  const parser = ctx.getParser<PoolState>(
    ctx.programs.hydraStaking,
    "PoolState"
  );

  return AccountLoader.PDA(ctx, programId, seeds, parser);
};
