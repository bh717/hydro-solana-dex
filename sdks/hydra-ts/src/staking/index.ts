import { Ctx } from "../types";
import * as wasm from "hydra-math-rs";
import { loadWasm } from "wasm-loader-ts";
import { TOKEN_PROGRAM_ID } from "@project-serum/serum/lib/token-instructions";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { web3 } from "@project-serum/anchor";
import { SystemProgram } from "@solana/web3.js";
import accounts from "./accounts";

const hydraMath = loadWasm(wasm);
async function tryGet<T>(fn: Promise<T>): Promise<T | undefined> {
  try {
    return await fn;
  } catch (err) {
    return undefined;
  }
}

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

export function initialize(ctx: Ctx) {
  return async (tokenVaultBump: number, poolStateBump: number) => {
    const acc = accounts(ctx);
    const redeemableMint = await acc.redeemableMint.key();
    const tokenMint = await acc.tokenMint.key();
    const tokenVault = await acc.tokenVault.key();
    const poolState = await acc.poolState.key();

    const program = ctx.programs.hydraStaking;

    await program.rpc.initialize(tokenVaultBump, poolStateBump, {
      accounts: {
        authority: program.provider.wallet.publicKey,
        tokenMint,
        redeemableMint,
        poolState,
        tokenVault,
        payer: program.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [
        (program.provider.wallet as NodeWallet).payer ||
          program.provider.wallet,
      ],
    });
  };
}

export function stake(ctx: Ctx) {
  return async (amount: BigInt) => {
    const acc = accounts(ctx);
    const redeemableMint = await acc.redeemableMint.key();
    const tokenMint = await acc.tokenMint.key();
    const tokenVault = await acc.tokenVault.key();
    const poolState = await acc.poolState.key();
    const userFrom = await tryGet(acc.userToken.key());
    const redeemableTo = await tryGet(acc.userRedeemable.key());
    const userFromAuthority = ctx.wallet.publicKey;
    const tokenProgram = TOKEN_PROGRAM_ID;

    if (!userFrom) {
      throw new Error(
        `Token owner account for tokenMint ${tokenMint} does not exist.`
      );
    }

    if (!redeemableTo) {
      throw new Error(
        `Token owner account for redeemableMint ${redeemableMint} does not exist.`
      );
    }

    await ctx.programs.hydraStaking.rpc.stake(ctx.utils.fromBigInt(amount), {
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
    });
  };
}
export function unstake(ctx: Ctx) {
  return async (amount: BigInt) => {
    const acc = accounts(ctx);
    const redeemableMint = await acc.redeemableMint.key();
    const tokenMint = await acc.tokenMint.key();
    const tokenVault = await acc.tokenVault.key();
    const poolState = await acc.poolState.key();
    const userTo = await tryGet(acc.userToken.key());
    const redeemableFrom = await tryGet(acc.userRedeemable.key());
    const redeemableFromAuthority = ctx.wallet.publicKey;

    if (!userTo) {
      throw new Error(
        `Token owner account for tokenMint ${tokenMint} does not exist.`
      );
    }

    if (!redeemableFrom) {
      throw new Error(
        `Token owner account for redeemableMint ${redeemableMint} does not exist.`
      );
    }

    await ctx.programs.hydraStaking.rpc.unstake(ctx.utils.fromBigInt(amount), {
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
    });
  };
}
