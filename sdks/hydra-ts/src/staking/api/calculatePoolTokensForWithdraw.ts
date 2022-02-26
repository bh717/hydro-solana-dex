import { Ctx } from "../../types";
import * as wasm from "hydra-math-rs";
import { loadWasm } from "wasm-loader-ts";

const hydraMath = loadWasm(wasm);

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
