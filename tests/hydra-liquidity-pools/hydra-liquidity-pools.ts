import * as anchor from '@project-serum/anchor';
import {BN, Program} from '@project-serum/anchor';
import { HydraLiquidityPools } from '../../target/types/hydra_liquidity_pools';
import assert from "assert";
import {TokenInstructions} from "@project-serum/serum";
import {createMintAndVault, createTokenAccount} from "@project-serum/common";
import {createMint, getTokenBalance} from "../utils/utils";
import {Keypair} from "@solana/web3.js";
import {TOKEN_PROGRAM_ID} from "@project-serum/serum/lib/token-instructions";
const utf8 = anchor.utils.bytes.utf8;

describe ("hydra-liquidity-pool", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const { SystemProgram } = anchor.web3;
  const program = anchor.workspace.HydraLiquidityPools as Program<HydraLiquidityPools>;
  const provider = anchor.Provider.env();

  let usdcMint
  let btcMint
  let usdcAccount
  let btcAccount
  const lpTokenMint = Keypair.generate()
  let lpTokenAccount

  let poolState
  let tokenAVault
  let tokenBVault

  let poolStateBump
  let tokenAVaultBump
  let tokenBVaultBump

  it('should create usdcMint (100 million)', async () =>  {
    [usdcMint, usdcAccount ] = await createMintAndVault(provider, new BN(100_000_000_000_000),provider.wallet.publicKey, 6)
  });

  it('should create btcMint (21 million)', async () =>  {
    [btcMint, btcAccount ] = await createMintAndVault(provider, new BN(21_000_000_000_000),provider.wallet.publicKey, 6)
  });

  it('should get the PDA for the PoolState', async () => {
    [poolState, poolStateBump] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8.encode("pool_state_seed"), usdcMint.toBuffer(), btcMint.toBuffer(), lpTokenMint.publicKey.toBuffer() ],
        program.programId
    );
  });

  it('should create lpTokenMint with poolState as the authority and a lpTokenAccount', async () => {
    await createMint(provider, lpTokenMint,poolState, 6)
    lpTokenAccount = await createTokenAccount(provider, lpTokenMint.publicKey, provider.wallet.publicKey)
  });

  it('should get the PDA for the TokenAVault', async () => {
    [tokenAVault, tokenAVaultBump] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8.encode("token_vault_seed"), usdcMint.toBuffer(), poolState.toBuffer(), lpTokenMint.publicKey.toBuffer() ],
        program.programId
    )
  });

  it('should get the PDA for the TokenBVault', async () => {
    [tokenBVault, tokenBVaultBump] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8.encode("token_vault_seed"), btcMint.toBuffer(), poolState.toBuffer(), lpTokenMint.publicKey.toBuffer() ],
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
            tokenAMint: usdcMint,
            tokenBMint: btcMint,
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
    assert.equal(poolStateAccount.tokenAMint.toString(), usdcMint.toString())
    assert.equal(poolStateAccount.tokenBMint.toString(), btcMint.toString())
    assert.equal(poolStateAccount.lpTokenMint.toString(), lpTokenMint.publicKey.toString())
    assert.equal(poolStateAccount.poolStateBump, poolStateBump)
    assert.equal(poolStateAccount.tokenAVaultBump, tokenAVaultBump)
    assert.equal(poolStateAccount.tokenBVaultBump, tokenBVaultBump)
  });

  it('should not add-liquidity to pool due to slippage', async () => {
    program.addEventListener("LpTokensIssued", (e,s) => {
      console.log(e.amount.toString());
    });

    try {
      const tx =
          await program.rpc.addLiquidity(
              new BN(255_575_287_200), // token_a_amount: $255,575.2872 usdc's @ ($42595.8812 each)
              new BN(6_000_000), // token_b_amount: 6, bitcoins
              new BN(1238326178),
              {
                accounts: {
                  poolState: poolState,
                  lpTokenMint: lpTokenMint.publicKey,
                  tokenAMint: usdcMint,
                  tokenBMint: btcMint,
                  tokenAVault: tokenAVault,
                  tokenBVault: tokenBVault,
                  lpTokenTo: lpTokenAccount,
                  userTokenA: usdcAccount,
                  userTokenB: btcAccount,
                  userAuthority: provider.wallet.publicKey,
                  tokenProgram: TOKEN_PROGRAM_ID,
                }
              }
          )

      assert.ok(false)
    } catch (err) {
      assert.equal(err.toString(), "Slippage Amount Exceeded")
    }
  });

  it('should add-liquidity to pool for the first time', async () => {
    // program.addEventListener("LpTokensIssued", (e,s) => {
    //   console.log("lp tokens: ",e.amount.toString())
    // });

    await program.rpc.addLiquidity(
        new BN(255_575_287_200), // token_a_amount: $255,575.2872 usdc's @($42595.8812 each)
        new BN(6_000_000), // token_b_amount: 6, bitcoins
        new BN(1238326177),
        {
          accounts: {
            poolState: poolState,
            lpTokenMint: lpTokenMint.publicKey,
            tokenAMint: usdcMint,
            tokenBMint: btcMint,
            tokenAVault: tokenAVault,
            tokenBVault: tokenBVault,
            lpTokenTo: lpTokenAccount,
            userTokenA: usdcAccount,
            userTokenB: btcAccount,
            userAuthority: provider.wallet.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          }
        }
    )
    assert.strictEqual(await getTokenBalance(provider, lpTokenAccount), 1238326177)
    assert.strictEqual(await getTokenBalance(provider, usdcAccount), 99744424712800)
    assert.strictEqual(await getTokenBalance(provider, btcAccount), 20999994000000)
  });

  it('should not add-liquidity to due to token deposit ratio not aligned', async () => {
    try {
      const tx =
          await program.rpc.addLiquidity(
              new BN(6_000_000), // token_a_amount: 6, bitcoins
              new BN(255_575_287_200), // token_b_amount: $255,575.2872 usdc's @ ($42595.8812 each)
              new BN(1),
              {
                accounts: {
                  poolState: poolState,
                  lpTokenMint: lpTokenMint.publicKey,
                  tokenAMint: usdcMint,
                  tokenBMint: btcMint,
                  tokenAVault: tokenAVault,
                  tokenBVault: tokenBVault,
                  lpTokenTo: lpTokenAccount,
                  userTokenA: usdcAccount,
                  userTokenB: btcAccount,
                  userAuthority: provider.wallet.publicKey,
                  tokenProgram: TOKEN_PROGRAM_ID,
                }
              }
          )
      assert.ok(false)
    } catch (err) {
      assert.equal(err.toString(), "Deposit tokens not in the correct ratio")
    }
  });

  it('should add-liquidity to pool for the second time', async () => {
    // program.addEventListener("LpTokensIssued", (e,s) => {
    // console.log("lp tokens: ",e.amount.toString())
    // });

    await program.rpc.addLiquidity(
        new BN(681_534_099_200), // token_a_amount: $686,006.512 usdc @($42595.8812 each)
        new BN(16_000_000), // token_b_amount: 16 bitcoins
        new BN(1),
        {
          accounts: {
            poolState: poolState,
            lpTokenMint: lpTokenMint.publicKey,
            tokenAMint: usdcMint,
            tokenBMint: btcMint,
            tokenAVault: tokenAVault,
            tokenBVault: tokenBVault,
            lpTokenTo: lpTokenAccount,
            userTokenA: usdcAccount,
            userTokenB: btcAccount,
            userAuthority: provider.wallet.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          }
        }
    )
    assert.strictEqual(await getTokenBalance(provider, lpTokenAccount), 1238326177 + 3302203139)
    assert.strictEqual(await getTokenBalance(provider, usdcAccount), 99062890613600)
    assert.strictEqual(await getTokenBalance(provider, btcAccount), 20999978000000)
  });
});