import { POOL_STATE_SEED, TOKEN_VAULT_SEED } from "../config/constants";
import { Ctx } from "../types";
import { Account } from "../types/account";
import { accounts } from "../utils/meta-utils";

export default accounts((ctx: Ctx) => {
  return {
    tokenVault: () => new Account(getTokenVaultAccount(ctx), ctx),
    poolState: () => new Account(getPoolStateAccount(ctx), ctx),
    redeemableMint: () => new Account(ctx.getKey("redeemableMint"), ctx),
    tokenMint: () => new Account(ctx.getKey("tokenMint"), ctx),
    userToken: () => new Account(getUserTokenAccount(ctx), ctx),
    userRedeemable: () => new Account(getUserRedeemableAccount(ctx), ctx),
  };
});

async function getUserTokenAccount(ctx: Ctx) {
  return await ctx.utils.getExistingOwnerTokenAccount(
    ctx.provider,
    ctx.getKey("tokenMint")
  );
}

async function getUserRedeemableAccount(ctx: Ctx) {
  return await ctx.utils.getExistingOwnerTokenAccount(
    ctx.provider,
    ctx.getKey("redeemableMint")
  );
}

async function getTokenVaultAccount(ctx: Ctx) {
  return await ctx.utils.getPDA(ctx.programs.hydraStaking.programId, [
    TOKEN_VAULT_SEED,
    ctx.getKey("tokenMint"),
    ctx.getKey("redeemableMint"),
  ]);
}

async function getPoolStateAccount(ctx: Ctx) {
  return await ctx.utils.getPDA(ctx.programs.hydraStaking.programId, [
    POOL_STATE_SEED,
    ctx.getKey("tokenMint"),
    ctx.getKey("redeemableMint"),
  ]);
}
