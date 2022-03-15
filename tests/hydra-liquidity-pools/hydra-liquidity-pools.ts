import * as anchor from "@project-serum/anchor";
import config from "config-ts/global-config.json";
import assert from "assert";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BTCD_MINT_AMOUNT, USDD_MINT_AMOUNT } from "../constants";
import { HydraSDK } from "hydra-ts";
import { PoolFees } from "hydra-ts/src/liquidity-pools/types";

describe("hydra-liquidity-pool", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  let sdk: HydraSDK;

  const lpTokenMint = Keypair.generate();
  let btcdMint: PublicKey;
  let usddMint: PublicKey;
  let btcdAccount: PublicKey;
  let usddAccount: PublicKey;

  let poolState: PublicKey;
  let tokenXVault: PublicKey;
  let tokenYVault: PublicKey;

  let poolStateBump: number;
  let tokenXVaultBump: number;
  let tokenYVaultBump: number;
  let poolStateAccount: any;

  let poolFees: PoolFees;

  before(async () => {
    sdk = HydraSDK.createFromAnchorProvider(
      provider,
      config.localnet.programIds
    );

    const btcdMintPair = Keypair.generate();
    const usddMintPair = Keypair.generate();

    const accounts = await sdk.liquidityPools.accounts.getInitAccountLoaders(
      btcdMintPair.publicKey,
      usddMintPair.publicKey,
      lpTokenMint.publicKey
    );

    [btcdMint, btcdAccount] = await sdk.common.createMintAndAssociatedVault(
      btcdMintPair,
      BTCD_MINT_AMOUNT
    );

    [usddMint, usddAccount] = await sdk.common.createMintAndAssociatedVault(
      usddMintPair,
      USDD_MINT_AMOUNT
    );

    // get the PDA for the PoolState
    poolState = await accounts.poolState.key();
    poolStateBump = await accounts.poolState.bump();

    // create lpTokenMint with poolState as the authority and a lpTokenAssociatedAccount
    await sdk.common.createMint(lpTokenMint, poolState, 9);
    await sdk.common.createAssociatedAccount(lpTokenMint.publicKey);
    tokenXVault = await accounts.tokenXVault.key();
    tokenXVaultBump = await accounts.tokenXVault.bump();
    tokenYVault = await accounts.tokenYVault.key();
    tokenYVaultBump = await accounts.tokenYVault.bump();
  });

  it("should initialize a liquidity-pool", async () => {
    poolFees = {
      swapFeeNumerator: 1n,
      swapFeeDenominator: 500n,
      ownerTradeFeeNumerator: 0n,
      ownerTradeFeeDenominator: 0n,
      ownerWithdrawFeeNumerator: 0n,
      ownerWithdrawFeeDenominator: 0n,
      hostFeeNumerator: 0n,
      hostFeeDenominator: 0n,
    };

    await sdk.liquidityPools.initialize(
      btcdMint,
      usddMint,
      lpTokenMint.publicKey,
      poolFees
    );

    poolStateAccount = (
      await sdk.liquidityPools.accounts.poolState(lpTokenMint.publicKey).info()
    ).data;

    assert.equal(
      poolStateAccount.authority.toString(),
      provider.wallet.publicKey.toString()
    );
    assert.equal(
      poolStateAccount.tokenXVault.toString(),
      tokenXVault.toString()
    );
    assert.equal(
      poolStateAccount.tokenYVault.toString(),
      tokenYVault.toString()
    );

    assert.equal(poolStateAccount.tokenXMint.toString(), btcdMint.toString());
    assert.equal(poolStateAccount.tokenYMint.toString(), usddMint.toString());
    assert.equal(
      poolStateAccount.lpTokenMint.toString(),
      lpTokenMint.publicKey.toString()
    );
    assert.equal(poolStateAccount.poolStateBump, poolStateBump);
    assert.equal(poolStateAccount.tokenXVaultBump, tokenXVaultBump);
    assert.equal(poolStateAccount.tokenYVaultBump, tokenYVaultBump);
  });

  it("should add-liquidity to pool for the first time", async () => {
    await sdk.liquidityPools.addLiquidity(
      6_000_000n,
      255_575_287_200n,
      0n,
      lpTokenMint.publicKey
    );

    const accounts = await sdk.liquidityPools.accounts.getAccountLoaders(
      lpTokenMint.publicKey
    );

    assert.strictEqual(
      await accounts.lpTokenAssociatedAccount.balance(),
      1238326078n
    );

    assert.strictEqual(
      await accounts.userTokenX.balance(),
      BTCD_MINT_AMOUNT - 6_000_000n
    );

    assert.strictEqual(
      await accounts.userTokenY.balance(),
      USDD_MINT_AMOUNT - 255_575_287_200n
    );
    assert.strictEqual(await accounts.lpTokenVault.balance(), 100n);
    assert.strictEqual(await accounts.tokenXVault.balance(), 6000000n);
    assert.strictEqual(await accounts.tokenYVault.balance(), 255575287200n);
  });

  it("should not add-liquidity on a second deposit with the 0 expected_lp_tokens", async () => {
    await sdk.liquidityPools.addLiquidity(
      6_000_000n,
      255_575_287_200n,
      0n,
      lpTokenMint.publicKey
    );

    const accounts = await sdk.liquidityPools.accounts.getAccountLoaders(
      lpTokenMint.publicKey
    );

    // no changes from last test case.
    assert.strictEqual(
      await accounts.lpTokenAssociatedAccount.balance(),
      1238326078n
    );

    assert.strictEqual(
      await accounts.userTokenX.balance(),
      BTCD_MINT_AMOUNT - 6_000_000n
    );

    assert.strictEqual(
      await accounts.userTokenY.balance(),
      USDD_MINT_AMOUNT - 255_575_287_200n
    );

    assert.strictEqual(await accounts.lpTokenVault.balance(), 100n);
    assert.strictEqual(await accounts.tokenXVault.balance(), 6000000n);
    assert.strictEqual(await accounts.tokenYVault.balance(), 255575287200n);
  });

  it("should add-liquidity to pool for the second time", async () => {
    await sdk.liquidityPools.addLiquidity(
      16_000_000n, // 16 bitcoins
      681_534_099_132n, // $681,534.099132 usdc
      3_302_203_141n,
      lpTokenMint.publicKey
    );

    const accounts = await sdk.liquidityPools.accounts.getAccountLoaders(
      lpTokenMint.publicKey
    );

    assert.strictEqual(
      await accounts.lpTokenAssociatedAccount.balance(),
      1238326078n + 3302203141n
    );

    assert.strictEqual(
      await accounts.userTokenX.balance(),
      BTCD_MINT_AMOUNT - 6_000_000n - 16_000_000n // first add - second add
    );

    assert.strictEqual(
      await accounts.userTokenY.balance(),
      USDD_MINT_AMOUNT - 255_575_287_200n - 681_534_099_132n // first add - second add
    );
    assert.strictEqual(await accounts.lpTokenVault.balance(), 100n); // no change
    assert.strictEqual(
      await accounts.tokenXVault.balance(),
      6000000n + 16000000n
    );
    assert.strictEqual(
      await accounts.tokenYVault.balance(),
      255575287200n + 681534099132n
    );
  });

  it("should not add-liquidity due to exceeding slippage ", async () => {
    try {
      await sdk.liquidityPools.addLiquidity(
        16_000_000n, // 16 bitcoins
        681_534_099_131n, // $681,534.099132 usdc -0.000001
        3_302_203_141n,
        lpTokenMint.publicKey
      );
      assert.ok(false);
    } catch (err: any) {
      const errMsg = "Slippage Amount Exceeded";
      assert.equal(err.toString(), errMsg);
    }

    const accounts = await sdk.liquidityPools.accounts.getAccountLoaders(
      lpTokenMint.publicKey
    );

    // no change from last test
    assert.strictEqual(
      await accounts.lpTokenAssociatedAccount.balance(),
      1238326078n + 3302203141n
    );
    assert.strictEqual(
      await accounts.userTokenX.balance(),
      BTCD_MINT_AMOUNT - 6_000_000n - 16_000_000n // first add - second add
    );
    assert.strictEqual(
      await accounts.userTokenY.balance(),
      USDD_MINT_AMOUNT - 255_575_287_200n - 681_534_099_132n // first add - second add
    );
    assert.strictEqual(await accounts.lpTokenVault.balance(), 100n);

    // no change
    assert.strictEqual(
      await accounts.tokenXVault.balance(),
      6000000n + 16000000n
    );
    assert.strictEqual(
      await accounts.tokenYVault.balance(),
      255575287200n + 681534099132n
    );
  });

  it("should remove-liquidity first time", async () => {
    const accounts = await sdk.liquidityPools.accounts.getAccountLoaders(
      lpTokenMint.publicKey
    );

    await sdk.liquidityPools.removeLiquidity(
      3_302_203_141n,
      lpTokenMint.publicKey
    );

    assert.strictEqual(
      await accounts.lpTokenAssociatedAccount.balance(),
      1238326078n
    );

    assert.strictEqual(await accounts.tokenXVault.balance(), 6_000_000n);
    assert.strictEqual(await accounts.tokenYVault.balance(), 255575287200n);
  });

  it("should fail token swap due to slippage error", async () => {
    try {
      await sdk.liquidityPools.swap(
        1_000_000n,
        36_510_755_315n,
        lpTokenMint.publicKey,
        btcdAccount,
        usddAccount
      );
      assert.ok(false);
    } catch (err: any) {
      const errMsg = "Slippage Amount Exceeded";
      assert.equal(err.toString(), errMsg);
    }
  });

  it("should swap (cpmm) btc to usd (x to y)", async () => {
<<<<<<< HEAD
    await program.rpc.swap(new BN(1_000_000), new BN(36_448_147_560), {
      // TODO slip needs to account for the fee as well...
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
      6_000_000 + 1_000_000 // original amount + swap in amount
    );

    assert.strictEqual(
      (await getTokenBalance(provider, quoteTokenVault)).toNumber(),
      255_575_287_200 - 36_448_147_560 // original amount - swap out amount
=======
    await sdk.liquidityPools.swap(
      1_000_000n,
      36_437_733_804n,
      lpTokenMint.publicKey,
      btcdAccount,
      usddAccount
    );
    const accounts = await sdk.liquidityPools.accounts.getAccountLoaders(
      lpTokenMint.publicKey
    );
    assert.strictEqual(
      await accounts.tokenXVault.balance(),
      6_000_000n + 1_000_000n + 2000n // original amount + swap in amount + fee
    );

    assert.strictEqual(
<<<<<<< HEAD
      (await getTokenBalance(provider, tokenYVault)).toNumber(),
      255_575_287_200 - 36_510_755_314 // original amount - swap out amount
>>>>>>> 48aabc1 (Add SDK to hydraliquiditypools)
=======
      await accounts.tokenYVault.balance(),
      255_575_287_200n - 36_510_755_314n // original amount - swap out amount
>>>>>>> bc27f10 (Update tests and poolFees to use BigInt)
    );
  });

  // TODO: uncomment once math functions implemented.
  // it("should swap (cpmm) usd to btc (y to x)", async () => {
  //// await program.rpc.swap(new BN(36_510_755_314), new BN(1_000_000), {
  ////   accounts: {
  ////     user: provider.wallet.publicKey,
  ////     poolState: poolState,
  ////     lpTokenMint: lpTokenMint.publicKey,
  ////     userFromToken: usddAccount,
  ////     userToToken: btcdAccount,
  ////    tokenXVault: tokenXVault,
  ////    tokenYVault: tokenYVault,
  ////     tokenProgram: TOKEN_PROGRAM_ID,
  ////   },
  //// });
  //
  // await sdk.liquidityPools.swap(
  //   36_510_755_314n,
  //   1_000_000n,
  //   lpTokenMint.publicKey,
  //   usddAccount,
  //   btcdAccount,
  // );
  //// TODO: convert to use sdk
  //   assert.strictEqual(
  //     (await getTokenBalance(provider, tokenXVault)).toNumber(),
  //     6_000_000 + 1_000_000
  //   );
  //
  //   assert.strictEqual(
  //     (await getTokenBalance(provider, tokenYVault)).toNumber(),
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
    const accounts = await sdk.liquidityPools.accounts.getAccountLoaders(
      lpTokenMint.publicKey
    );

    await sdk.liquidityPools.removeLiquidity(
      1238326078n,
      lpTokenMint.publicKey
    );

    assert.strictEqual(await accounts.lpTokenAssociatedAccount.balance(), 0n);

    assert.strictEqual(await accounts.lpTokenVault.balance(), 100n);

    assert.strictEqual(
      await accounts.userTokenX.balance(),
      21_000_000_000_000n
    );

    assert.strictEqual(
      await accounts.userTokenY.balance(),
      100_000_000_000_000n - 17695n // Always left in the pool.
    );
  });
});
