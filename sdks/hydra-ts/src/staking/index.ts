import { Ctx } from "../types";
import * as wasm from "hydra-math-rs";
import { loadWasm } from "wasm-loader-ts";
import { TOKEN_PROGRAM_ID } from "@project-serum/serum/lib/token-instructions";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { fromBigInt, getOwnerTokenAccount, getPDA } from "../utils/utils";
import { POOL_STATE_SEED, TOKEN_VAULT_SEED } from "../config/constants";

const hydraMath = loadWasm(wasm);

export function calculatePoolTokensForDeposit(_: Ctx) {
  return async (
    amount: BigInt,
    totalTokenVault: BigInt,
    totalRedeemableTokens: BigInt
  ) => {
    return await hydraMath.calculate_pool_tokens_for_deposit(
      amount,
      totalTokenVault,
      totalRedeemableTokens
    );
  };
}

export function calculatePoolTokensForWithdraw(_: Ctx) {
  return async (
    amount: BigInt,
    totalTokens: BigInt,
    totalRedeemableTokens: BigInt
  ) => {
    return await hydraMath.calculate_pool_tokens_for_withdraw(
      amount,
      totalTokens,
      totalRedeemableTokens
    );
  };
}

export function stake(ctx: Ctx) {
  return async (amount: BigInt) => {
    const redeemableMint = ctx.getKey("redeemableMint");
    const tokenMint = ctx.getKey("tokenMint");
    const tokenVault = await getTokenVaultAccount(ctx);
    const poolState = await getPoolStateAccount(ctx);

    const userFromAuthority = ctx.wallet.publicKey;

    const tokenProgram = TOKEN_PROGRAM_ID;

    const userFrom = await getOwnerTokenAccount(ctx.provider, tokenMint);

    const redeemableTo = await getOwnerTokenAccount(
      ctx.provider,
      redeemableMint
    );

    await ctx.programs.hydraStaking.rpc.stake(fromBigInt(amount), {
      accounts: {
        poolState,
        tokenMint,
        redeemableMint,
        userFrom,
        userFromAuthority,
        tokenVault,
        redeemableTo,
        tokenProgram,
      },

      // XXX: concerning that payer is not on this type - needs investigation
      signers: [(ctx.provider.wallet as NodeWallet).payer],
    });
  };
}
export function unstake(ctx: Ctx) {
  return async (amount: BigInt) => {
    const redeemableMint = ctx.getKey("redeemableMint");
    const tokenMint = ctx.getKey("tokenMint");
    const tokenVault = await getTokenVaultAccount(ctx);
    const poolState = await getPoolStateAccount(ctx);

    const redeemableFromAuthority = ctx.wallet.publicKey;

    const userTo = await getOwnerTokenAccount(ctx.provider, tokenMint);

    const redeemableFrom = await getOwnerTokenAccount(
      ctx.provider,
      redeemableMint
    );

    await ctx.programs.hydraStaking.rpc.unstake(fromBigInt(amount), {
      accounts: {
        poolState,
        tokenMint,
        redeemableMint,
        userTo,
        tokenVault,
        redeemableFrom,
        redeemableFromAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
      },

      // XXX: concerning that payer is not on this type - needs investigation
      signers: [(ctx.provider.wallet as NodeWallet).payer],
    });
  };
}

async function getTokenVaultAccount(ctx: Ctx) {
  return (
    await getPDA(ctx.programs.hydraStaking.programId, [
      TOKEN_VAULT_SEED,
      ctx.getKey("tokenMint"),
      ctx.getKey("redeemableMint"),
    ])
  )[0];
}

async function getPoolStateAccount(ctx: Ctx) {
  return (
    await getPDA(ctx.programs.hydraStaking.programId, [
      POOL_STATE_SEED,
      ctx.getKey("tokenMint"),
      ctx.getKey("redeemableMint"),
    ])
  )[0];
}
