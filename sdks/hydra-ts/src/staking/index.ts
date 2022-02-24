import { Ctx } from "../types";
import * as wasm from "hydra-math-rs";
import { loadWasm } from "wasm-loader-ts";
import { BN, Wallet, web3 } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@project-serum/serum/lib/token-instructions";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";

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

export function getTokenVaultAccount(ctx: Ctx) {
  return async () => {
    return ctx.getPDA(
      "token_vault_seed",
      ctx.getKey("tokenMint"),
      ctx.getKey("redeemableMint")
    );
  };
}

export function getPoolStateAccount(ctx: Ctx) {
  return async () => {
    return ctx.getPDA(
      "pool_state_seed",
      ctx.getKey("tokenMint"),
      ctx.getKey("redeemableMint")
    );
  };
}

export function stake(ctx: Ctx) {
  return async (amount: BigInt) => {
    const redeemableMint = ctx.getKey("redeemableMint");
    const tokenMint = ctx.getKey("tokenMint");
    const [tokenVault] = await getTokenVaultAccount(ctx)();
    const [poolState] = await getPoolStateAccount(ctx)();

    const userFromAuthority = ctx.wallet.publicKey;

    const tokenProgram = TOKEN_PROGRAM_ID;

    const userFrom = await ctx.getOwnerTokenAccount(tokenMint);

    const redeemableTo = await ctx.getOwnerTokenAccount(redeemableMint);

    await ctx.programs.hydraStaking.rpc.stake(new BN(amount.toString()), {
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
    const [tokenVault] = await getTokenVaultAccount(ctx)();
    const [poolState] = await getPoolStateAccount(ctx)();

    const redeemableFromAuthority = ctx.wallet.publicKey;

    const tokenProgram = TOKEN_PROGRAM_ID;

    const userTo = await ctx.getOwnerTokenAccount(tokenMint);

    const redeemableFrom = await ctx.getOwnerTokenAccount(redeemableMint);

    await ctx.programs.hydraStaking.rpc.unstake(new BN(amount.toString()), {
      accounts: {
        poolState,
        tokenMint,
        redeemableMint,
        userTo,
        tokenVault,
        redeemableFrom,
        redeemableFromAuthority,
        tokenProgram,
      },

      // XXX: concerning that payer is not on this type - needs investigation
      signers: [(ctx.provider.wallet as NodeWallet).payer],
    });
  };
}
