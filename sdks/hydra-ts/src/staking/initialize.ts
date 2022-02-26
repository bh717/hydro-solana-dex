import { Ctx } from "../types";
import { TOKEN_PROGRAM_ID } from "@project-serum/serum/lib/token-instructions";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { web3 } from "@project-serum/anchor";
import { SystemProgram } from "@solana/web3.js";
import accounts from "./accounts";

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
