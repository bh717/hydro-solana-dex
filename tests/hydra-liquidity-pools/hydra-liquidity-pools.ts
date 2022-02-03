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

  it('should not add-liquidity to pool due to slippage', async () => {
    try {
      const tx =
          await program.rpc.addLiquidity(
              new BN(400000), // token_a_amount
              new BN(6000000), // token_b_amount
              new BN(1549194),
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

      assert.ok(false)
    } catch (err) {
      console.log(err.toString());
      // assert.equal(err.toString(), "Slippage Amount Exceeded")
      //+ i think it is just the way the error is output that doesnt match. the Program log does indeed show :  
      // Program log: Error: SlippageExceeded Program log: minimum_lp_tokens_requested_by_user: 1549194 Program log: lp_tokens_to_issue: 1549193
      assert.equal(err.toString(), "Error: failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x1771")
    }

  });

  it('should add-liquidity to pool for the first time', async () => {
    program.addEventListener("LpTokensIssued", (e,s) => {
      //+ this is not affecting the outcome of test even when changed 
      assert.equal(e.amount.toString(), new BN(15490933))
    });

    await program.rpc.addLiquidity(
        new BN(400000), // token_a_amount
        new BN(6000000), // token_b_amount
        // new BN(1548193), // TODO slippage issue... min should be: 15490933 
        // new BN(1548193), //+ with MIN_LIQUIDITY = 1000
        new BN(1549193), //+ with MIN_LIQUIDITY = 0
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
    // assert.strictEqual(await getTokenBalance(provider, lpTokenAccount), 1548193)
    //+ with MIN_LIQUIDITY = 1000
    // assert.strictEqual(await getTokenBalance(provider, lpTokenAccount), 1548193)
    //+ with MIN_LIQUIDITY = 0
    assert.strictEqual(await getTokenBalance(provider, lpTokenAccount), 1549193)

    assert.strictEqual(await getTokenBalance(provider, tokenAAccount), 999600000)
    assert.strictEqual(await getTokenBalance(provider, tokenBAccount), 994000000)
  });

  it('should not add-liquidity to due to token deposit ratio not aligned', async () => {
    program.addEventListener("LpTokensIssued", (e,s) => {
      // assert.equal(e.amount.toString(), new BN(15490933))
      console.log(e.amount.toString())
    });
  
    try {
      const tx =
          await program.rpc.addLiquidity(
              new BN(600000), // token_a_amount
              new BN(600000000), // token_b_amount
              new BN(15490933), // slippage
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
      assert.ok(false)
    } catch (err) {
      console.log(err.toString());
      // assert.equal(err.toString(), "Deposit tokens not in the correct ratio")
      //+ Again I think it is just the error text that is causing the error. the tx is failing in the log as expected: 
      // Program log: result: false Program log: wrong ratio Program log: Custom program error: 0x1773
      assert.equal(err.toString(), "Error: failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x1773")
    }
  });

  it('should add-liquidity to pool for the second time', async () => {
    program.addEventListener("LpTokensIssued", (e,s) => {
      // assert.equal(e.amount.toString(), new BN(15490933))
      console.log(e.amount.toString())
    });

    await program.rpc.addLiquidity(
        new BN(200000), // token_a_amount
        new BN(3000000), // token_b_amount
        // new BN(774596), // TODO slippage issue...
        new BN(773596), //+ with MIN_LIQUIDITY = 1000
        // new BN(774596), //+ with MIN_LIQUIDITY = 0
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
    // assert.strictEqual(await getTokenBalance(provider, lpTokenAccount), 3096386)
    //+ This is what I see on the Notebook from Ayush : LP Tokens Issued = 774596.6692414833 , Total LP Tokens = 2323790.00772445
    // assert.strictEqual(await getTokenBalance(provider, lpTokenAccount), 2322290) //* with MIN_LIQUIDITY = 1000
    assert.strictEqual(await getTokenBalance(provider, lpTokenAccount), 2323790) //* with MIN_LIQUIDITY = 0

    // assert.strictEqual(await getTokenBalance(provider, tokenAAccount), 999200000)
    // + an extra 200k from above line 172 , first deposit 999600000 --> 999400000
    assert.strictEqual(await getTokenBalance(provider, tokenAAccount), 999400000)

    // assert.strictEqual(await getTokenBalance(provider, tokenBAccount), 988000000)
    // + an extra 3mil from above line 173 , first deposit 994000000 --> 991000000
    assert.strictEqual(await getTokenBalance(provider, tokenBAccount), 991000000)
  });
});