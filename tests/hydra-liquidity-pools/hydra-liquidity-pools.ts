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
import {btcdMintAmount, usddMintAmount} from "../const"

describe ("hydra-liquidity-pool", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.HydraLiquidityPools as Program<HydraLiquidityPools>;
  const provider = anchor.Provider.env();

  let btcdMint
  let usddMint
  let btcdAccount
  let usddAccount
  const lpTokenMint = Keypair.generate()
  let lpTokenAccount

  let poolState
  let tokenAVault
  let tokenBVault
  let lpTokenVault

  let poolStateBump
  let tokenAVaultBump
  let tokenBVaultBump
  let lpTokenVaultBump


  it('should create btcdMint (21 million)', async () =>  {
    [btcdMint, btcdAccount ] = await createMintAndVault(provider, btcdMintAmount, provider.wallet.publicKey, 6)
  });

  it('should create usddMint (100 million)', async () =>  {
    [usddMint, usddAccount ] = await createMintAndVault(provider, usddMintAmount, provider.wallet.publicKey, 6)
  });

  it('should get the PDA for the PoolState', async () => {
    [poolState, poolStateBump] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8.encode("pool_state_seed"), lpTokenMint.publicKey.toBuffer() ],
        program.programId
    );
  });

  it('should create lpTokenMint with poolState as the authority and a lpTokenAccount', async () => {
    await createMint(provider, lpTokenMint,poolState, 9)
    lpTokenAccount = await createTokenAccount(provider, lpTokenMint.publicKey, provider.wallet.publicKey)
  });

  it('should get the PDA for the TokenAVault', async () => {
    [tokenAVault, tokenAVaultBump] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8.encode("token_vault_seed"), btcdMint.toBuffer(), poolState.toBuffer(), lpTokenMint.publicKey.toBuffer() ],
        program.programId
    )
  });

  it('should get the PDA for the TokenBVault', async () => {
    [tokenBVault, tokenBVaultBump] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8.encode("token_vault_seed"), usddMint.toBuffer(), poolState.toBuffer(), lpTokenMint.publicKey.toBuffer() ],
        program.programId
    )
  });

  it('should get the PDA for lpTokenVault', async () => {
    [lpTokenVault, lpTokenVaultBump] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8.encode("lp_token_vault_seed"), poolState.toBuffer(), lpTokenMint.publicKey.toBuffer()],
        program.programId
    )
  });

  it('should initialize a liquidity-pool', async () => {
    await program.rpc.initialize (
        tokenAVaultBump,
        tokenBVaultBump,
        poolStateBump,
        lpTokenVaultBump,
        {
          accounts: {
            authority: provider.wallet.publicKey,
            payer: provider.wallet.publicKey,
            poolState: poolState,
            tokenAMint: btcdMint,
            tokenBMint: usddMint,
            lpTokenMint: lpTokenMint.publicKey,
            tokenAVault: tokenAVault,
            tokenBVault: tokenBVault,
            lpTokenVault: lpTokenVault,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      }
    });

    const poolStateAccount = await program.account.poolState.fetch(poolState)

    assert.equal(poolStateAccount.authority.toString(),provider.wallet.publicKey.toString())
    assert.equal(poolStateAccount.tokenAVault.toString(), tokenAVault.toString())
    assert.equal(poolStateAccount.tokenBVault.toString(), tokenBVault.toString())
    assert.equal(poolStateAccount.tokenAMint.toString(), btcdMint.toString())
    assert.equal(poolStateAccount.tokenBMint.toString(), usddMint.toString())
    assert.equal(poolStateAccount.lpTokenMint.toString(), lpTokenMint.publicKey.toString())
    assert.equal(poolStateAccount.poolStateBump, poolStateBump)
    assert.equal(poolStateAccount.tokenAVaultBump, tokenAVaultBump)
    assert.equal(poolStateAccount.tokenBVaultBump, tokenBVaultBump)
  });

  // it('should not add-liquidity to pool due to slippage', async () => {
  //   try {
  //     await program.rpc.addLiquidity(
  //         new BN(255_575_287_200), //$255,575.2872 usdc's @ ($42595.8812 each)
  //         new BN(6_000_000), // token_b_amount: 6, bitcoins
  //         new BN(1238326178),
  //         {
  //           accounts: {
  //             poolState: poolState,
  //             lpTokenMint: lpTokenMint.publicKey,
  //             tokenAMint: btcdMint,
  //             tokenBMint: usddMint,
  //             tokenAVault: tokenAVault,
  //             tokenBVault: tokenBVault,
  //             lpTokenTo: lpTokenAccount,
  //             userTokenA: btcdAccount,
  //             userTokenB: usddAccount,
  //             userAuthority: provider.wallet.publicKey,
  //             tokenProgram: TOKEN_PROGRAM_ID,
  //           }
  //         }
  //     )
  //     assert.ok(false)
  //   } catch (err) {
  //     assert.equal(err.toString(), "Slippage Amount Exceeded")
  //   }
  //
  //   assert.strictEqual((await getTokenBalance(provider, lpTokenAccount)).toNumber(), 0)
  //   assert.strictEqual((await getTokenBalance(provider, btcdAccount)).toNumber(), btcdMintAmount.toNumber())
  //   assert.strictEqual((await getTokenBalance(provider, usddAccount)).toNumber(), usddMintAmount.toNumber())
  // });
  //
  it('should add-liquidity to pool for the first time', async () => {
    await program.rpc.addLiquidity(
        new BN(6_000_000),        // 6, bitcoins
        new BN(255_575_287_200),  // $255,575.2872 usdc's @($42595.8812 each)
        new BN(0),                // not used on first deposit.
        {
          accounts: {
            poolState: poolState,
            tokenAMint: btcdMint,
            tokenBMint: usddMint,
            lpTokenMint: lpTokenMint.publicKey,
            userTokenA: btcdAccount,
            userTokenB: usddAccount,
            userAuthority: provider.wallet.publicKey,
            tokenAVault: tokenAVault,
            tokenBVault: tokenBVault,
            lpTokenVault: lpTokenVault,
            lpTokenTo: lpTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          }
        }
    )
    assert.strictEqual((await getTokenBalance(provider, lpTokenAccount)).toNumber(), 1238326078)
    assert.strictEqual((await getTokenBalance(provider, btcdAccount)).toNumber(), btcdMintAmount.isub(new BN(6_000_000)).toNumber())
    assert.strictEqual((await getTokenBalance(provider, usddAccount)).toNumber(), usddMintAmount.isub( new BN(255_575_287_200)).toNumber())
    assert.strictEqual((await getTokenBalance(provider, lpTokenVault)).toNumber(), 100)
    assert.strictEqual((await getTokenBalance(provider, tokenAVault)).toNumber(), 6000000)
    assert.strictEqual((await getTokenBalance(provider, tokenBVault)).toNumber(), 255575287200)
  });
  //
  // it('should not add-liquidity to due to token deposit ratio not aligned', async () => {
  //   program.addEventListener("LpTokensMinted", (e,s) => {
  //     console.log(e.amount.toString())
  //   })
  //
  //   program.addEventListener("TokensTransferred" , (e,s) => {
  //     console.log(e.token_a.toString())
  //     console.log(e.token_b.toString())
  //   })
  //
  //
  //   try {
  //     await program.rpc.addLiquidity(
  //         new BN(255_575_287_200),  // $255,575.2872 usdc's @ ($42595.8812 each)
  //         new BN(6_000_000),        // 6, bitcoins
  //         new BN(1238326077),
  //         {
  //           accounts: {
  //             poolState: poolState,
  //             lpTokenMint: lpTokenMint.publicKey,
  //             tokenAMint: btcdMint,
  //             tokenBMint: usddMint,
  //             tokenAVault: tokenAVault,
  //             tokenBVault: tokenBVault,
  //             lpTokenTo: lpTokenAccount,
  //             userTokenA: btcdAccount,
  //             userTokenB: usddAccount,
  //             userAuthority: provider.wallet.publicKey,
  //             tokenProgram: TOKEN_PROGRAM_ID,
  //           }
  //         }
  //     )
  //     assert.ok(false)
  //   } catch (err) {
  //     assert.equal(err.toString(), "Deposit tokens not in the correct ratio")
  //   }
  //
  //   // no changes from last test case.
  //   assert.strictEqual((await getTokenBalance(provider, lpTokenAccount)).toNumber(), 1238326078)
  //   assert.strictEqual((await getTokenBalance(provider, btcdAccount)).toNumber(), btcdMintAmount.toNumber())
  //   assert.strictEqual((await getTokenBalance(provider, usddAccount)).toNumber(), usddMintAmount.toNumber())
  // });
  //
  // it('should add-liquidity to pool for the second time', async () => {
  //   await program.rpc.addLiquidity(
  //       new BN(16_000_000), // 16 bitcoins
  //       new BN(681_534_099_200), // $686,006.512 usdc @($42595.8812 each)
  //       new BN(1),
  //       {
  //         accounts: {
  //           poolState: poolState,
  //           lpTokenMint: lpTokenMint.publicKey,
  //           tokenAMint: btcdMint,
  //           tokenBMint: usddMint,
  //           tokenAVault: tokenAVault,
  //           tokenBVault: tokenBVault,
  //           lpTokenTo: lpTokenAccount,
  //           userTokenA: btcdAccount,
  //           userTokenB: usddAccount,
  //           userAuthority: provider.wallet.publicKey,
  //           tokenProgram: TOKEN_PROGRAM_ID,
  //         }
  //       }
  //   )
  //   assert.strictEqual((await getTokenBalance(provider, lpTokenAccount)).toNumber(), 1238326078 + 3302202874)
  //   assert.strictEqual((await getTokenBalance(provider, btcdAccount)).toNumber(), btcdMintAmount.isub(new BN(16_000_000)).toNumber())
  //   assert.strictEqual((await getTokenBalance(provider, usddAccount)).toNumber(), usddMintAmount.isub( new BN(681_534_099_200)).toNumber())
  // });
});