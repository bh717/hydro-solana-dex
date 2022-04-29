import { Ctx } from "../..";
import * as anchor from "@project-serum/anchor";
import * as accs from "../accounts";
import { inject } from "../../utils/meta-utils";
import { TOKEN_PROGRAM_ID } from "@project-serum/serum/lib/token-instructions";
import { PublicKey } from "@solana/web3.js";
import { PoolFees } from "../types";
import { toBN } from "../../utils";

type AnchorPoolFees = { [K in keyof PoolFees]: anchor.BN };

function toAnchorPoolFees(fees: PoolFees): AnchorPoolFees {
  return {
    swapFeeNumerator: toBN(fees.swapFeeNumerator),
    swapFeeDenominator: toBN(fees.swapFeeDenominator),
    ownerTradeFeeNumerator: toBN(fees.ownerTradeFeeNumerator),
    ownerTradeFeeDenominator: toBN(fees.ownerTradeFeeDenominator),
    ownerWithdrawFeeNumerator: toBN(fees.ownerWithdrawFeeNumerator),
    ownerWithdrawFeeDenominator: toBN(fees.ownerWithdrawFeeDenominator),
    hostFeeNumerator: toBN(fees.hostFeeNumerator),
    hostFeeDenominator: toBN(fees.hostFeeDenominator),
  };
}

export function initialize(ctx: Ctx) {
  return async (
    tokenXMint: PublicKey,
    tokenYMint: PublicKey,
    // The following should probably not
    // be inputs and be set within the program from
    // CPI calls
    poolFees: PoolFees,
    compensationParameter: number = 0,
    pythProduct?: PublicKey,
    pythPrice?: PublicKey
  ) => {
    const program = ctx.programs.hydraLiquidityPools;
    const accounts = await inject(accs, ctx).getAccountLoaders(
      tokenXMint,
      tokenYMint
    );
    const tokenXVaultBump = await accounts.tokenXVault.bump();
    const tokenYVaultBump = await accounts.tokenYVault.bump();
    const poolStateBump = await accounts.poolState.bump();
    const lpTokenVaultBump = await accounts.lpTokenVault.bump();
    const lpTokenMintBump = await accounts.lpTokenMint.bump();

    const initializeBase = program.methods
      .initialize(
        tokenXVaultBump,
        tokenYVaultBump,
        poolStateBump,
        lpTokenVaultBump,
        lpTokenMintBump,
        compensationParameter,
        toAnchorPoolFees(poolFees)
      )
      .accounts({
        authority: program.provider.wallet.publicKey,
        payer: program.provider.wallet.publicKey,
        poolState: await accounts.poolState.key(),
        tokenXMint,
        tokenYMint,
        lpTokenMint: await accounts.lpTokenMint.key(),
        tokenXVault: await accounts.tokenXVault.key(),
        tokenYVault: await accounts.tokenYVault.key(),
        lpTokenVault: await accounts.lpTokenVault.key(),
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      });

    const instruction =
      pythProduct && pythPrice
        ? initializeBase.remainingAccounts([
            { pubkey: pythProduct, isSigner: false, isWritable: false },
            { pubkey: pythPrice, isSigner: false, isWritable: false },
          ])
        : initializeBase;

    await instruction.rpc({ commitment: "confirmed" });
  };
}
