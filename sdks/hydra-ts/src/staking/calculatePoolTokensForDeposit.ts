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
    return await hydraMath.calculate_pool_tokens_for_deposit(
      amount,
      totalTokenVault,
      totalRedeemableTokens
    );
  };
}
