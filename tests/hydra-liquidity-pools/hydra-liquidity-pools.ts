import * as anchor from '@project-serum/anchor';
import {BN, Program} from '@project-serum/anchor';
import { HydraLiquidityPools } from '../../target/types/hydra_liquidity_pools';
import assert from "assert";
import {TokenInstructions} from "@project-serum/serum";
import {createMintAndVault, createTokenAccount} from "@project-serum/common";
import {createMint} from "../utils/utils";
import {Keypair} from "@solana/web3.js";
import {TOKEN_PROGRAM_ID} from "@project-serum/serum/lib/token-instructions";
const utf8 = anchor.utils.bytes.utf8;

describe ("hydra-liquidity-pool", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const { SystemProgram } = anchor.web3;
  const program = anchor.workspace.HydraLiquidityPools as Program<HydraLiquidityPools>;
  const provider = anchor.Provider.env();

  let tokenAMint
  let tokenBMint
  let tokenAAccount
  let tokenBAccount
  const lpTokenMint = Keypair.generate()
  let lpTokenAccount

  let poolState
  let tokenAVault
  let tokenBVault

  let poolStateBump
  let tokenAVaultBump
  let tokenBVaultBump

  it('should create tokenAMint', async () =>  {
    [tokenAMint, tokenAAccount ] = await createMintAndVault(provider, new BN(1_000_000_000),provider.wallet.publicKey, 9)
  });

  it('should create tokenBMint', async () =>  {
    [tokenBMint, tokenBAccount ] = await createMintAndVault(provider, new BN(1_000_000_000),provider.wallet.publicKey, 9)
  });

  it('should get the PDA for the PoolState', async () => {
    [poolState, poolStateBump] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8.encode("pool_state_seed"), tokenAMint.toBuffer(), tokenBMint.toBuffer(), lpTokenMint.publicKey.toBuffer() ],
        program.programId
    );
  });

  it('should create lpTokenMint with poolState as the authority and a lpTokenAccount', async () => {
    await createMint(provider, lpTokenMint,poolState, 9)
    lpTokenAccount = await createTokenAccount(provider, lpTokenMint.publicKey, provider.wallet.publicKey)
  });

  it('should get the PDA for the TokenAVault', async () => {
    [tokenAVault, tokenAVaultBump] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8.encode("token_vault_seed"), tokenAMint.toBuffer(), poolState.toBuffer(), lpTokenMint.publicKey.toBuffer() ],
        program.programId
    )
  });

  it('should get the PDA for the TokenBVault', async () => {
    [tokenBVault, tokenBVaultBump] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8.encode("token_vault_seed"), tokenBMint.toBuffer(), poolState.toBuffer(), lpTokenMint.publicKey.toBuffer() ],
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
            lpTokenMint: lpTokenMint.publicKey,
            tokenAVault: tokenAVault,
            tokenBVault: tokenBVault,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      }
    });

    const poolStateAccount = await program.account.poolState.fetch(poolState)

    assert.equal(poolStateAccount.authority.toString(),provider.wallet.publicKey.toString())
    assert.equal(poolStateAccount.tokenAVault.toString(), tokenAVault.toString())
    assert.equal(poolStateAccount.tokenBVault.toString(), tokenBVault.toString())
    assert.equal(poolStateAccount.tokenAMint.toString(), tokenAMint.toString())
    assert.equal(poolStateAccount.tokenBMint.toString(), tokenBMint.toString())
    assert.equal(poolStateAccount.lpTokenMint.toString(), lpTokenMint.publicKey.toString())
    assert.equal(poolStateAccount.poolStateBump, poolStateBump)
    assert.equal(poolStateAccount.tokenAVaultBump, tokenAVaultBump)
    assert.equal(poolStateAccount.tokenBVaultBump, tokenBVaultBump)
  });

  it('should add-liquidity to pool', async () => {
    await program.rpc.addLiquidity(
        new BN(100000),
        new BN(100000),
        {
          accounts: {
            poolState: poolState,
            lpTokenMint: lpTokenMint.publicKey,
            tokenAMint: tokenAMint,
            tokenBMint: tokenBMint,
            tokenAVault: tokenAVault,
            tokenBVault: tokenBVault,
            lpTokenTo: lpTokenAccount,
            userTokenA: tokenAAccount,
            userTokenB: tokenBAccount,
            userAuthority: provider.wallet.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          }
        }
    )
  });
});