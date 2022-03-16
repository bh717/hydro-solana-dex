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

    const accounts = await sdk.liquidityPools.accounts.getAccountLoaders(
      btcdMintPair.publicKey,
      usddMintPair.publicKey
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
    tokenXVault = await accounts.tokenXVault.key();
    tokenXVaultBump = await accounts.tokenXVault.bump();
    tokenYVault = await accounts.tokenYVault.key();
    tokenYVaultBump = await accounts.tokenYVault.bump();
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

    await sdk.liquidityPools.initialize(btcdMint, usddMint, poolFees);

    await sdk.common.createAssociatedAccount(await accounts.lpTokenMint.key());
  });

  it("should initialize a liquidity-pool", async () => {
    const accounts = await sdk.liquidityPools.accounts.getAccountLoaders(
      btcdMint,
      usddMint
    );

    const poolStateInfo = await accounts.poolState.info();
    const poolStateAccount = poolStateInfo.data;

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
      (await accounts.lpTokenMint.key()).toString()
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
      btcdMint,
      usddMint
    );

    const accounts = await sdk.liquidityPools.accounts.getAccountLoaders(
      btcdMint,
      usddMint
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
      btcdMint,
      usddMint
    );

    const accounts = await sdk.liquidityPools.accounts.getAccountLoaders(
      btcdMint,
      usddMint
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
      btcdMint,
      usddMint
    );

    const accounts = await sdk.liquidityPools.accounts.getAccountLoaders(
      btcdMint,
      usddMint
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
        btcdMint,
        usddMint
      );
      assert.ok(false);
    } catch (err: any) {
      const errMsg = "Slippage Amount Exceeded";
      assert.equal(err.toString(), errMsg);
    }

    const accounts = await sdk.liquidityPools.accounts.getAccountLoaders(
      btcdMint,
      usddMint
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
      btcdMint,
      usddMint
    );

    await sdk.liquidityPools.removeLiquidity(
      3_302_203_141n,
      btcdMint,
      usddMint
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
        btcdMint,
        usddMint,
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
    await sdk.liquidityPools.swap(
      1_000_000n,
      36_448_147_560n,
      btcdMint,
      usddMint,
      btcdAccount,
      usddAccount
    );

    const accounts = await sdk.liquidityPools.accounts.getAccountLoaders(
      btcdMint,
      usddMint
    );

    assert.strictEqual(
      await accounts.tokenXVault.balance(),
      6_000_000n + 1_000_000n // original amount + swap in amount + fee
    );

    assert.strictEqual(
      await accounts.tokenYVault.balance(),
      255_575_287_200n - 36_448_147_560n // original amount - swap out amount
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
      btcdMint,
      usddMint
    );

    await sdk.liquidityPools.removeLiquidity(1238326078n, btcdMint, usddMint);

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
