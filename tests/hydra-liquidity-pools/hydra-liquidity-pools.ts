import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
import config from "config-ts/global-config.json";
import {
  HydraLiquidityPools,
  IDL,
} from "types-ts/codegen/types/hydra_liquidity_pools";
import assert from "assert";
import { TokenInstructions } from "@project-serum/serum";
import { createMintAndVault, createTokenAccount } from "@project-serum/common";
import { Keypair, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@project-serum/serum/lib/token-instructions";

const utf8 = anchor.utils.bytes.utf8;
import { btcdMintAmount, usddMintAmount } from "../constants";

import { HydraSDK } from "hydra-ts";

const getTokenBalance = async (
  provider: anchor.Provider,
  pubkey: PublicKey
) => {
  return new BN(
    (await provider.connection.getTokenAccountBalance(pubkey)).value.amount
  );
};
describe("hydra-liquidity-pool", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const sdk = HydraSDK.createFromAnchorProvider(provider, "localnet");

  const hydraLiquidityPoolsProgramId = new anchor.web3.PublicKey(
    config.localnet.programIds.hydraLiquidityPools
  );
  const program = new anchor.Program(
    IDL,
    hydraLiquidityPoolsProgramId
  ) as Program<HydraLiquidityPools>;

  let btcdMint: PublicKey;
  let usddMint: PublicKey;
  let btcdAccount: PublicKey;
  let usddAccount: PublicKey;
  const lpTokenMint = Keypair.generate();
  let lpTokenAccount: PublicKey;

  let poolState: PublicKey;
  let baseTokenVault: PublicKey;
  let quoteTokenVault: PublicKey;
  let lpTokenVault: PublicKey;

  let poolStateBump: number;
  let baseTokenVaultBump: number;
  let quoteTokenVaultBump: number;
  let lpTokenVaultBump: number;
  let poolStateAccount: any;

  let poolFees;

  it("should create btcdMint (21 million)", async () => {
    [btcdMint, btcdAccount] = await createMintAndVault(
      provider,
      btcdMintAmount,
      provider.wallet.publicKey,
      6
    );
  });

  it("should create usddMint (100 million)", async () => {
    [usddMint, usddAccount] = await createMintAndVault(
      provider,
      usddMintAmount,
      provider.wallet.publicKey,
      6
    );
  });

  it("should get the PDA for the PoolState", async () => {
    [poolState, poolStateBump] = await anchor.web3.PublicKey.findProgramAddress(
      [utf8.encode("pool_state_seed"), lpTokenMint.publicKey.toBuffer()],
      program.programId
    );
  });

  it("should create lpTokenMint with poolState as the authority and a lpTokenAccount", async () => {
    await sdk.common.createMint(lpTokenMint, poolState, 9);
    lpTokenAccount = await createTokenAccount(
      provider,
      lpTokenMint.publicKey,
      provider.wallet.publicKey
    );
  });

  it("should get the PDA for the TokenAVault", async () => {
    [baseTokenVault, baseTokenVaultBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          utf8.encode("token_vault_seed"),
          btcdMint.toBuffer(),
          lpTokenMint.publicKey.toBuffer(),
        ],
        program.programId
      );
  });

  it("should get the PDA for the TokenBVault", async () => {
    [quoteTokenVault, quoteTokenVaultBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          utf8.encode("token_vault_seed"),
          usddMint.toBuffer(),
          lpTokenMint.publicKey.toBuffer(),
        ],
        program.programId
      );
  });

  it("should get the PDA for lpTokenVault", async () => {
    [lpTokenVault, lpTokenVaultBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          utf8.encode("lp_token_vault_seed"),
          poolState.toBuffer(),
          lpTokenMint.publicKey.toBuffer(),
        ],
        program.programId
      );
  });

  it("should initialize a liquidity-pool", async () => {
    poolFees = {
      tradeFeeNumerator: new BN(1),
      tradeFeeDenominator: new BN(500),
    };

    await program.rpc.initialize(
      baseTokenVaultBump,
      quoteTokenVaultBump,
      poolStateBump,
      lpTokenVaultBump,
      0, // TODO need to hand this code better after talking with the math kids about it more.
      poolFees,
      {
        accounts: {
          authority: provider.wallet.publicKey,
          payer: provider.wallet.publicKey,
          poolState: poolState,
          tokenXMint: btcdMint,
          tokenYMint: usddMint,
          lpTokenMint: lpTokenMint.publicKey,
          tokenXVault: baseTokenVault,
          tokenYVault: quoteTokenVault,
          lpTokenVault,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
      }
    );

    poolStateAccount = await program.account.poolState.fetch(poolState);

    assert.equal(
      poolStateAccount.authority.toString(),
      provider.wallet.publicKey.toString()
    );
    assert.equal(
      poolStateAccount.tokenXVault.toString(),
      baseTokenVault.toString()
    );
    assert.equal(
      poolStateAccount.tokenYVault.toString(),
      quoteTokenVault.toString()
    );

    assert.equal(poolStateAccount.tokenXMint.toString(), btcdMint.toString());
    assert.equal(poolStateAccount.tokenYMint.toString(), usddMint.toString());
    assert.equal(
      poolStateAccount.lpTokenMint.toString(),
      lpTokenMint.publicKey.toString()
    );
    assert.equal(poolStateAccount.poolStateBump, poolStateBump);
    assert.equal(poolStateAccount.tokenXVaultBump, baseTokenVaultBump);
    assert.equal(poolStateAccount.tokenYVaultBump, quoteTokenVaultBump);
  });

  it("should add-liquidity to pool for the first time", async () => {
    await program.rpc.addLiquidity(
      new BN(6_000_000), // 6, bitcoins
      new BN(255_575_287_200), // $255,575.2872 usdc's @($42595.8812 each)
      new BN(0), // not used on first deposit.
      {
        accounts: {
          poolState: poolState,
          lpTokenMint: lpTokenMint.publicKey,
          userTokenX: btcdAccount,
          userTokenY: usddAccount,
          user: provider.wallet.publicKey,
          tokenXVault: baseTokenVault,
          tokenYVault: quoteTokenVault,
          lpTokenVault,
          lpTokenTo: lpTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    );
    assert.strictEqual(
      (await getTokenBalance(provider, lpTokenAccount)).toNumber(),
      1238326078
    );
    assert.strictEqual(
      (await getTokenBalance(provider, btcdAccount)).toNumber(),
      btcdMintAmount.isub(new BN(6_000_000)).toNumber()
    );
    assert.strictEqual(
      (await getTokenBalance(provider, usddAccount)).toNumber(),
      usddMintAmount.isub(new BN(255_575_287_200)).toNumber()
    );
    assert.strictEqual(
      (await getTokenBalance(provider, lpTokenVault)).toNumber(),
      100
    );
    assert.strictEqual(
      (await getTokenBalance(provider, baseTokenVault)).toNumber(),
      6000000
    );
    assert.strictEqual(
      (await getTokenBalance(provider, quoteTokenVault)).toNumber(),
      255575287200
    );
  });

  it("should not add-liquidity on a second deposit with the 0 expected_lp_tokens", async () => {
    await program.rpc.addLiquidity(
      new BN(6_000_000), // 6, bitcoins
      new BN(255_575_287_200), // $255,575.2872 usdc's
      new BN(0),
      {
        accounts: {
          poolState: poolState,
          lpTokenMint: lpTokenMint.publicKey,
          userTokenX: btcdAccount,
          userTokenY: usddAccount,
          user: provider.wallet.publicKey,
          tokenXVault: baseTokenVault,
          tokenYVault: quoteTokenVault,
          lpTokenVault,
          lpTokenTo: lpTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    );

    // no changes from last test case.
    assert.strictEqual(
      (await getTokenBalance(provider, lpTokenAccount)).toNumber(),
      1238326078
    );
    assert.strictEqual(
      (await getTokenBalance(provider, btcdAccount)).toNumber(),
      btcdMintAmount.toNumber()
    );
    assert.strictEqual(
      (await getTokenBalance(provider, usddAccount)).toNumber(),
      usddMintAmount.toNumber()
    );
    assert.strictEqual(
      (await getTokenBalance(provider, lpTokenVault)).toNumber(),
      100
    );
    assert.strictEqual(
      (await getTokenBalance(provider, baseTokenVault)).toNumber(),
      6000000
    );
    assert.strictEqual(
      (await getTokenBalance(provider, quoteTokenVault)).toNumber(),
      255575287200
    );
  });

  it("should add-liquidity to pool for the second time", async () => {
    await program.rpc.addLiquidity(
      new BN(16_000_000), // 16 bitcoins
      new BN(681_534_099_132), // $681,534.099132 usdc
      new BN(3_302_203_141),
      {
        accounts: {
          poolState: poolState,
          lpTokenMint: lpTokenMint.publicKey,
          userTokenX: btcdAccount,
          userTokenY: usddAccount,
          user: provider.wallet.publicKey,
          tokenXVault: baseTokenVault,
          tokenYVault: quoteTokenVault,
          lpTokenVault,
          lpTokenTo: lpTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    );
    assert.strictEqual(
      (await getTokenBalance(provider, lpTokenAccount)).toNumber(),
      1238326078 + 3302203141
    );
    assert.strictEqual(
      (await getTokenBalance(provider, btcdAccount)).toNumber(),
      btcdMintAmount.isub(new BN(16_000_000)).toNumber()
    );
    assert.strictEqual(
      (await getTokenBalance(provider, usddAccount)).toNumber(),
      usddMintAmount.isub(new BN(681_534_099_132)).toNumber()
    );
    assert.strictEqual(
      (await getTokenBalance(provider, lpTokenVault)).toNumber(),
      100
    ); // no change
    assert.strictEqual(
      (await getTokenBalance(provider, baseTokenVault)).toNumber(),
      6000000 + 16000000
    );
    assert.strictEqual(
      (await getTokenBalance(provider, quoteTokenVault)).toNumber(),
      255575287200 + 681534099132
    );
  });

  it("should not add-liquidity due to exceeding slippage ", async () => {
    try {
      await program.rpc.addLiquidity(
        new BN(16_000_000), // 16 bitcoins
        new BN(681_534_099_131), // // $681,534.099132 usdc -0.000001
        new BN(3_302_203_141),
        {
          accounts: {
            poolState: poolState,
            lpTokenMint: lpTokenMint.publicKey,
            userTokenX: btcdAccount,
            userTokenY: usddAccount,
            user: provider.wallet.publicKey,
            tokenXVault: baseTokenVault,
            tokenYVault: quoteTokenVault,
            lpTokenVault,
            lpTokenTo: lpTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          },
        }
      );
      assert.ok(false);
    } catch (err: any) {
      const errMsg = "Slippage Amount Exceeded";
      assert.equal(err.toString(), errMsg);
    }

    // no change from last test
    assert.strictEqual(
      (await getTokenBalance(provider, lpTokenAccount)).toNumber(),
      1238326078 + 3302203141
    );
    assert.strictEqual(
      (await getTokenBalance(provider, btcdAccount)).toNumber(),
      btcdMintAmount.toNumber()
    );
    assert.strictEqual(
      (await getTokenBalance(provider, usddAccount)).toNumber(),
      usddMintAmount.toNumber()
    );
    assert.strictEqual(
      (await getTokenBalance(provider, lpTokenVault)).toNumber(),
      100
    );
    // no change
    assert.strictEqual(
      (await getTokenBalance(provider, baseTokenVault)).toNumber(),
      6000000 + 16000000
    );
    assert.strictEqual(
      (await getTokenBalance(provider, quoteTokenVault)).toNumber(),
      255575287200 + 681534099132
    );
  });

  it("should remove-liquidity first time", async () => {
    await program.rpc.removeLiquidity(new BN(3_302_203_141), {
      accounts: {
        poolState: poolState,
        user: provider.wallet.publicKey,
        userRedeemableLpTokens: lpTokenAccount,
        userTokenX: btcdAccount,
        userTokenY: usddAccount,
        tokenXVault: baseTokenVault,
        tokenYVault: quoteTokenVault,
        lpTokenMint: lpTokenMint.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });

    assert.strictEqual(
      (await getTokenBalance(provider, lpTokenAccount)).toNumber(),
      1238326078
    );

    assert.strictEqual(
      (await getTokenBalance(provider, btcdAccount)).toNumber(),
      btcdMintAmount.iadd(new BN(16_000_000)).toNumber()
    );

    assert.strictEqual(
      (await getTokenBalance(provider, usddAccount)).toNumber(),
      usddMintAmount.iadd(new BN(681_534_099_132)).toNumber()
    );
  });

  it("should fail token swap due to slippage error", async () => {
    try {
      await program.rpc.swap(new BN(1_000_000), new BN(36_510_755_315), {
        accounts: {
          user: provider.wallet.publicKey,
          poolState: poolState,
          lpTokenMint: lpTokenMint.publicKey,
          userFromToken: btcdAccount,
          userToToken: usddAccount,
          tokenXVault: baseTokenVault,
          tokenYVault: quoteTokenVault,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      });
      assert.ok(false);
    } catch (err: any) {
      const errMsg = "Slippage Amount Exceeded";
      assert.equal(err.toString(), errMsg);
    }
  });

  it("should swap (cpmm) btc to usd (x to y)", async () => {
    await program.rpc.swap(new BN(1_000_000), new BN(36_437_733_804), {
      accounts: {
        user: provider.wallet.publicKey,
        poolState: poolState,
        lpTokenMint: lpTokenMint.publicKey,
        userFromToken: btcdAccount,
        userToToken: usddAccount,
        tokenXVault: baseTokenVault,
        tokenYVault: quoteTokenVault,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });

    assert.strictEqual(
      (await getTokenBalance(provider, baseTokenVault)).toNumber(),
      6_000_000 + 1_000_000
    );

    assert.strictEqual(
      (await getTokenBalance(provider, quoteTokenVault)).toNumber(),
      255_575_287_200 - 36_437_733_804
    );

    assert.strictEqual(
      (await getTokenBalance(provider, btcdAccount)).toNumber(),
      20_999_993_000_000
    );

    assert.strictEqual(
      (await getTokenBalance(provider, usddAccount)).toNumber(),
      99_780_862_446_604
    );
  });

  // TODO: uncomment once math functions implemented.
  // it("should swap (cpmm) usd to btc (y to x)", async () => {
  //   await program.rpc.swap(new BN(36_510_755_314), new BN(1_000_000), {
  //     accounts: {
  //       user: provider.wallet.publicKey,
  //       poolState: poolState,
  //       lpTokenMint: lpTokenMint.publicKey,
  //       userFromToken: usddAccount,
  //       userToToken: btcdAccount,
  //       tokenXVault: baseTokenVault,
  //       tokenYVault: quoteTokenVault,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //     },
  //   });
  //
  //   assert.strictEqual(
  //     (await getTokenBalance(provider, baseTokenVault)).toNumber(),
  //     6_000_000 + 1_000_000
  //   );
  //
  //   assert.strictEqual(
  //     (await getTokenBalance(provider, quoteTokenVault)).toNumber(),
  //     255_575_287_200 - 36_510_755_314
  //   );
  //
  //   assert.strictEqual(
  //     (await getTokenBalance(provider, btcdAccount)).toNumber(),
  //     20_999_993_000_000
  //   );
  //
  //   assert.strictEqual(
  //     (await getTokenBalance(provider, usddAccount)).toNumber(),
  //     99_780_935_468_114
  //   );
  // });

  it("should remove-liquidity for the last time", async () => {
    await program.rpc.removeLiquidity(new BN(1238326078), {
      accounts: {
        poolState: poolState,
        user: provider.wallet.publicKey,
        userRedeemableLpTokens: lpTokenAccount,
        userTokenX: btcdAccount,
        userTokenY: usddAccount,
        tokenXVault: baseTokenVault,
        tokenYVault: quoteTokenVault,
        lpTokenMint: lpTokenMint.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });

    assert.strictEqual(
      (await getTokenBalance(provider, lpTokenAccount)).toNumber(),
      0
    );

    assert.strictEqual(
      (await getTokenBalance(provider, lpTokenVault)).toNumber(),
      100
    );

    assert.strictEqual(
      (await getTokenBalance(provider, btcdAccount)).toNumber(),
      21_000_000_000_000
    );

    assert.strictEqual(
      (await getTokenBalance(provider, usddAccount)).toNumber(),
      100_000_000_000_000 - 17696 // Always left in the pool.
    );
  });
});
