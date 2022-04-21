import { Ctx } from "../../types";
import { AccountData } from "../../accountLoaders/account-loader";
import { TokenAccount } from "../../types/token-account";
import { TokenMint } from "../../types/token-mint";
import * as wasm from "hydra-math-rs";
import { loadWasm } from "wasm-loader-ts";
import { PoolState } from "../types";

const hydraMath = loadWasm(wasm);

function parseCalculatorValues(p: {
  tokenXMint: AccountData<TokenMint>;
  tokenYMint: AccountData<TokenMint>;
  tokenXVault: AccountData<TokenAccount>;
  tokenYVault: AccountData<TokenAccount>;
  poolState: AccountData<PoolState>;
}) {
  const x0 = p.tokenXVault.account.data.amount;
  const x0Scale = p.tokenXMint.account.data.decimals;

  const y0 = p.tokenYVault.account.data.amount;
  const y0Scale = p.tokenYMint.account.data.decimals;
  const c = p.poolState.account.data.compensationParameter;
  // TODO: get oracle price i and scale from pyth
  const i = 0n;
  const iScale = 0;

  // The following don't come back correctly because of a bug in the anchor parser from what I can tell
  const feeNumer = BigInt(
    p.poolState.account.data.fees.swapFeeNumerator.toString()
  );
  const feeDenom = BigInt(
    p.poolState.account.data.fees.swapFeeDenominator.toString()
  );

  return [x0, x0Scale, y0, y0Scale, c, i, iScale, feeNumer, feeDenom] as [
    typeof x0,
    typeof x0Scale,
    typeof y0,
    typeof y0Scale,
    typeof c,
    typeof i,
    typeof iScale,
    typeof feeNumer,
    typeof feeDenom
  ];
}

export function swapXToYHmm(_: Ctx) {
  return async (
    x0: bigint,
    xScale: number,
    y0: bigint,
    yScale: number,
    c: number,
    i: bigint,
    iScale: number,
    feeNumer: bigint,
    feedenom: bigint,
    amount: bigint
  ) => {
    return hydraMath.swap_x_to_y_hmm(
      x0,
      xScale,
      y0,
      yScale,
      c,
      i,
      iScale,
      feeNumer,
      feedenom,
      amount
    );
  };
}

export function swapYToXHmm(_: Ctx) {
  return async (
    x0: bigint,
    xScale: number,
    y0: bigint,
    yScale: number,
    c: number,
    i: bigint,
    iScale: number,
    feeNumer: bigint,
    feedenom: bigint,
    amount: bigint
  ) => {
    return hydraMath.swap_y_to_x_hmm(
      x0,
      xScale,
      y0,
      yScale,
      c,
      i,
      iScale,
      feeNumer,
      feedenom,
      amount
    );
  };
}

export function calculateSwap(_: Ctx) {
  return async (
    tokenXMint: AccountData<TokenMint>,
    tokenYMint: AccountData<TokenMint>,
    tokenXVault: AccountData<TokenAccount>,
    tokenYVault: AccountData<TokenAccount>,
    poolState: AccountData<PoolState>,
    amount: bigint,
    direction: "xy" | "yx"
  ): Promise<BigUint64Array> => {
    if (amount === 0n) return BigUint64Array.from([0n, 0n, 0n, 0n, 0n]);
    try {
      console.log({ tokenXMint, tokenXVault, tokenYMint, tokenYVault });
      const args = parseCalculatorValues({
        tokenXMint,
        tokenXVault,
        tokenYMint,
        tokenYVault,
        poolState,
      });

      console.log("swappy: calculateSwap IN:", { args, direction, amount });

      const swapper =
        direction === "xy"
          ? hydraMath.swap_x_to_y_hmm
          : hydraMath.swap_y_to_x_hmm;
      console.log("swappy: selected direction " + direction);

      const output = await swapper(...args, amount);
      console.log("swappy: calculateSwap OUT:", output);

      return output;
    } catch (err) {
      console.log("swappy: ERROR: calculateSwap", err);
      return BigUint64Array.from([0n, 0n, 0n, 0n, 0n]);
    }
  };
}
