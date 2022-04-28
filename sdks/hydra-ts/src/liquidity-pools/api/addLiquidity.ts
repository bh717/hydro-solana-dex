import { PublicKey } from "@solana/web3.js";
import { Ctx } from "../../types";
import * as accs from "../accounts";
import { toBN } from "../../utils";
import { inject } from "../../utils/meta-utils";
import { SystemProgram } from "@solana/web3.js";
import * as SPLToken from "@solana/spl-token";
import { web3 } from "@project-serum/anchor";
import * as wasm from "hydra-math-rs";
import { loadWasm } from "wasm-loader-ts";
import * as AccountLoader from "../../libs/account-loader";
import { TokenMint } from "../../types";
const hydraMath = loadWasm(wasm);

async function calculateK(
  tokenXAmount: bigint,
  tokenXDecimals: number,
  tokenYAmount: bigint,
  tokenYDecimals: number
): Promise<bigint> {
  const kOrUndefined = await hydraMath.calculate_k(
    tokenXAmount,
    tokenXDecimals,
    tokenYAmount,
    tokenYDecimals
  );
  return (kOrUndefined || 0n) as bigint;
}

async function getDecimalsFromMint(ctx: Ctx, mintKey: PublicKey) {
  const mintLoader = AccountLoader.Mint(ctx, mintKey);
  const info = await mintLoader.info();
  return info.data.decimals;
}

export function addLiquidity(ctx: Ctx) {
  return async (
    tokenXMint: PublicKey,
    tokenYMint: PublicKey,
    tokenXAmount: bigint,
    tokenYAmount: bigint,
    slippage: bigint = 100n
  ) => {
    const tokenXMaxAmount = (tokenXAmount * (10_000n + slippage)) / 10_000n;
    const tokenYMaxAmount = (tokenYAmount * (10_000n + slippage)) / 10_000n;
    const program = ctx.programs.hydraLiquidityPools;
    const accounts = inject(accs, ctx);
    const {
      tokenXVault,
      tokenYVault,
      lpTokenVault,
      userTokenX,
      userTokenY,
      lpTokenMint,
      lpTokenAssociatedAccount,
      poolState,
    } = await accounts.getAccountLoaders(tokenXMint, tokenYMint);

    const tokenXDecimals = await getDecimalsFromMint(ctx, tokenXMint);
    const tokenYDecimals = await getDecimalsFromMint(ctx, tokenYMint);

    // let lpTokenMintInfo;
    let lpTokenMintInfo: web3.AccountInfo<TokenMint>;

    try {
      lpTokenMintInfo = await lpTokenMint.info();
    } catch (err) {
      throw new Error("Pool is not initialized! Try calling initialize first.");
    }

    const poolIsFunded = lpTokenMintInfo.data.supply > 0n;

    if (!poolIsFunded) {
      return await program.rpc.addFirstLiquidity(
        toBN(tokenXMaxAmount),
        toBN(tokenYMaxAmount),
        {
          accounts: {
            poolState: await poolState.key(),
            lpTokenMint: await lpTokenMint.key(),
            userTokenX: await userTokenX.key(),
            userTokenY: await userTokenY.key(),
            tokenXMint,
            tokenYMint,
            user: ctx.provider.wallet.publicKey,
            tokenXVault: await tokenXVault.key(),
            tokenYVault: await tokenYVault.key(),
            lpTokenVault: await lpTokenVault.key(),
            lpTokenTo: await lpTokenAssociatedAccount.key(),
            systemProgram: SystemProgram.programId,
            tokenProgram: SPLToken.TOKEN_PROGRAM_ID,
            associatedTokenProgram: SPLToken.ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: web3.SYSVAR_RENT_PUBKEY,
          },
        }
      );
    }

    const expectedLpTokens = await calculateK(
      tokenXAmount,
      tokenXDecimals,
      tokenYAmount,
      tokenYDecimals
    );
    console.log("about to addLiquidity", {
      tokenXAmount,
      tokenYAmount,
      tokenXMaxAmount,
      tokenYMaxAmount,
      expectedLpTokens,
    });
    await program.rpc.addLiquidity(
      toBN(tokenXMaxAmount),
      toBN(tokenYMaxAmount),
      toBN(expectedLpTokens),
      {
        accounts: {
          tokenXMint,
          tokenYMint,
          poolState: await poolState.key(),
          lpTokenMint: await lpTokenMint.key(),
          userTokenX: await userTokenX.key(),
          userTokenY: await userTokenY.key(),
          user: ctx.provider.wallet.publicKey,
          tokenXVault: await tokenXVault.key(),
          tokenYVault: await tokenYVault.key(),
          lpTokenVault: await lpTokenVault.key(),
          lpTokenTo: await lpTokenAssociatedAccount.key(),
          systemProgram: SystemProgram.programId,
          tokenProgram: SPLToken.TOKEN_PROGRAM_ID,
          associatedTokenProgram: SPLToken.ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: web3.SYSVAR_RENT_PUBKEY,
        },
      }
    );
  };
}
