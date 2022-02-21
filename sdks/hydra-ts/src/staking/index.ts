import { Ctx } from "../types";
import * as wasm from "hydra-math-rs";
import { loadWasm } from "wasm-loader-ts";

const hydraMath = loadWasm(wasm);

export function calculatePoolTokensForDeposit(_: Ctx) {
  return async (
    amount: BigInt,
    totalTokenVault: BigInt,
    totalRedeemableTokens: BigInt
  ) => {
    return await hydraMath.calc_pool_tokens_for_deposit(
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
    return await hydraMath.calc_pool_tokens_for_withdraw(
      amount,
      totalTokens,
      totalRedeemableTokens
    );
  };
}

export function stake(ctx: Ctx) {
  return async () => {};
}
export function unstake(ctx: Ctx) {
  return async () => {};
}
