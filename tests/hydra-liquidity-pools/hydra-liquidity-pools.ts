import * as anchor from '@project-serum/anchor';
import {BN, Program} from '@project-serum/anchor';
import { HydraLiquidityPools } from '../../target/types/hydra_liquidity_pools';
import assert from "assert";
import {TokenInstructions} from "@project-serum/serum";
import {createMint, createMintAndVault} from "@project-serum/common";
const utf8 = anchor.utils.bytes.utf8;

describe ("hydra-liquidity-pool", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const { SystemProgram } = anchor.web3;
  const program = anchor.workspace.HydraLiquidityPools as Program<HydraLiquidityPools>;
  const provider = anchor.Provider.env();

  let tokenAMint
  let tokenBMint
  let token_a_account
  let token_b_account
  let lpTokenMint

  let poolState
  let tokenAVault
  let tokenBVault

  let poolStateBump
  let tokenAVaultBump
  let tokenBVaultBump

  it('should create tokenAMint', async () =>  {
    [tokenAMint, token_a_account ] = await createMintAndVault(provider, new BN(1_000_000_000),provider.wallet.publicKey, 9)
  });

  it('should create tokenBMint', async () =>  {
    [tokenBMint, token_b_account ] = await createMintAndVault(provider, new BN(1_000_000_000),provider.wallet.publicKey, 9)
  });


  it('should get the PDA for the PoolState', async () => {
    [poolState, poolStateBump] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8.encode("pool_state_seed"), tokenAMint.toBuffer(), tokenBMint.toBuffer() ],
        program.programId
    );
  });

  it('should create lpTokenMint with poolState as the authority', async () => {
    lpTokenMint = await createMint(provider, poolState, 9)
  });

  it('should get the PDA for the TokenAVault', async () => {
    [tokenAVault, tokenAVaultBump] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8.encode("token_vault_seed"), tokenAMint.toBuffer(), poolState.toBuffer(), lpTokenMint.toBuffer() ],
        program.programId
    )
  });

  it('should get the PDA for the TokenBVault', async () => {
    [tokenBVault, tokenBVaultBump] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8.encode("token_vault_seed"), tokenBMint.toBuffer(), poolState.toBuffer(), lpTokenMint.toBuffer() ],
        program.programId
    )
  });

  it('should initialize a liquidity-pool', async () => {
    await program.rpc.initialize(
        tokenAVaultBump,
        tokenBVaultBump,
        poolStateBump,
        {
          accounts: {
            authority: provider.wallet.publicKey,
            payer: provider.wallet.publicKey,
            poolState: poolState,
            tokenAMint: tokenAMint,
            tokenBMint: tokenBMint,
            lpTokenMint: lpTokenMint,
            tokenAVault: tokenAVault,
            tokenBVault: tokenBVault,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      }
    });
  });
});