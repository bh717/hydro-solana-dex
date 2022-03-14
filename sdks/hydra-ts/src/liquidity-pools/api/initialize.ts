import { Ctx } from "../..";
import * as anchor from "@project-serum/anchor";
import * as accs from "../accounts";
import { inject } from "../../utils/meta-utils";
import { TOKEN_PROGRAM_ID } from "@project-serum/serum/lib/token-instructions";
import { Keypair, PublicKey } from "@solana/web3.js";

export function initialize(ctx: Ctx) {
  return async (
    tokenXMint: PublicKey,
    tokenYMint: PublicKey,
    // TODO: should this init if needed?
    lpTokenMint: PublicKey = Keypair.generate().publicKey,
    poolFees: {
      tradeFeeNumerator: anchor.BN;
      tradeFeeDenominator: anchor.BN;
    }
  ) => {
    const program = ctx.programs.hydraLiquidityPools;
    const accounts = await inject(accs, ctx).getInitAccountLoaders(
      tokenXMint,
      tokenYMint,
      lpTokenMint
    );

    const tokenXVaultBump = await accounts.tokenXVault.bump();
    const tokenYVaultBump = await accounts.tokenYVault.bump();
    const poolStateBump = await accounts.poolState.bump();
    const lpTokenVaultBump = await accounts.lpTokenVault.bump();

    await program.rpc.initialize(
      tokenXVaultBump,
      tokenYVaultBump,
      poolStateBump,
      lpTokenVaultBump,
      0, // compensation_parameter
      poolFees,
      {
        accounts: {
          authority: program.provider.wallet.publicKey,
          payer: program.provider.wallet.publicKey,
          poolState: await accounts.poolState.key(),
          tokenXMint,
          tokenYMint,
          lpTokenMint,
          tokenXVault: await accounts.tokenXVault.key(),
          tokenYVault: await accounts.tokenYVault.key(),
          lpTokenVault: await accounts.lpTokenVault.key(),
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
      }
    );
  };
}
