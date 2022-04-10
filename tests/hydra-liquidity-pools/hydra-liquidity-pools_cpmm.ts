import * as anchor from "@project-serum/anchor";
import config from "config-ts/global-config.json";
import assert from "assert";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { BTCD_MINT_AMOUNT, USDD_MINT_AMOUNT } from "../constants";
import { HydraSDK } from "hydra-ts";
import { PoolFees } from "hydra-ts/src/liquidity-pools/types";
import { AccountLoader } from "hydra-ts";
import { toBN } from "../../sdks/hydra-ts/src/utils";
import * as SPLToken from "@solana/spl-token";
import { web3 } from "@project-serum/anchor";

function orderKeyPairs(a: Keypair, b: Keypair) {
  if (a.publicKey.toBuffer().compare(b.publicKey.toBuffer()) > 0) {
    return [b, a];
  }

  return [a, b];
}

describe("hydra-liquidity-pool-cpmm", () => {
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

  let poolFees: PoolFees;

  before(async () => {
    sdk = HydraSDK.createFromAnchorProvider(
      provider,
      config.localnet.programIds
    );

    // Keys will be ordered based on base58 encoding
    const [btcdMintPair, usddMintPair] = orderKeyPairs(
      Keypair.generate(),
      Keypair.generate()
    );

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
  });

  it("should fail to initialize because tokens are in the wrong order", async () => {
    try {
      await sdk.liquidityPools.initialize(usddMint, btcdMint, poolFees);
      assert.ok(false, "No error was thrown");
    } catch (err: any) {
      const errMsg = "Token addresses order is invalid";
      assert(err.toString().includes(errMsg));
    }
  });

  it("should initialize a liquidity-pool", async () => {
    const accounts = await sdk.liquidityPools.accounts.getAccountLoaders(
      btcdMint,
      usddMint
    );

    await sdk.liquidityPools.initialize(btcdMint, usddMint, poolFees);

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

  it("should not add-liquidity to pool with the wrong instruction for the first time", async () => {
    try {
      await sdk.liquidityPools.addLiquidity(
        btcdMint,
        usddMint,
        6_000_000n,
        255_575_287_200n,
        0n
      );
      assert.ok(false);
    } catch (err: any) {
      const errMsg = "PoolNotFunded";
      assert(err.toString().includes(errMsg));
    }
  });

  it("should add-first-liquidity to the initialized empty pool", async () => {
    await sdk.liquidityPools.addFirstLiquidity(
      btcdMint,
      usddMint,
      6_000_000n,
      255_575_287_200n
    );

    const accounts = await sdk.liquidityPools.accounts.getAccountLoaders(
      btcdMint,
      usddMint
    );

    assert.strictEqual(
      await accounts.lpTokenAssociatedAccount.balance(),
      // (6.000000*255575.287200)**0.5 - 100 = 1138.3261780323
      1138_326178n
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

  it("should not add-first-liquidity to a funded pool", async () => {
    try {
      await sdk.liquidityPools.addFirstLiquidity(
        btcdMint,
        usddMint,
        6_000_000n,
        255_575_287_200n
      );
      assert.ok(false);
    } catch (err: any) {
      const errMsg = "PoolAlreadyFunded";
      assert(err.toString().includes(errMsg));
    }
  });

  it("should add-liquidity to pool for the second time", async () => {
    await sdk.liquidityPools.addLiquidity(
      btcdMint,
      usddMint,
      16_000_000n, // 16 bitcoins
      681_534_099_132n, // $681,534.099132 usdc
      3_302_203_141n
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
        btcdMint,
        usddMint,
        16_000_000n, // 16 bitcoins
        681_534_099_131n, // $681,534.099132 usdc -0.000001
        3_302_203_141n
      );
      assert.ok(false);
    } catch (err: any) {
      const errMsg = "Slippage Amount Exceeded";
      assert(err.toString().includes(errMsg));
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
      btcdMint,
      usddMint,
      3_302_203_141n
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
        btcdMint,
        usddMint,
        btcdAccount,
        usddAccount,
        1_000_000n,
        36_510_755_315n
      );
      assert.ok(false);
    } catch (err: any) {
      const errMsg = "Slippage Amount Exceeded";
      assert(err.toString().includes(errMsg));
    }
  });

  it("should swap (cpmm) btc to usd (x to y)", async () => {
    await sdk.liquidityPools.swap(
      btcdMint,
      usddMint,
      btcdAccount,
      usddAccount,
      1_000_000n,
      36_448_147_560n
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

  it("should swap (cpmm) from usd to btc (y to x)", async () => {
    await sdk.liquidityPools.swap(
      btcdMint,
      usddMint,
      usddAccount,
      btcdAccount,
      36_510_755_314n,
      1_000_000n - 1960n // - fee
    );

    const accounts = await sdk.liquidityPools.accounts.getAccountLoaders(
      btcdMint,
      usddMint
    );

    assert.strictEqual(
      await accounts.tokenYVault.balance(),
      219127139640n + 36_510_755_314n
    );

    assert.strictEqual(
      await accounts.tokenXVault.balance(),
      7_000_000n - 1_000_000n + 1960n // original amount - swap + fee
    );

    assert.strictEqual(
      await accounts.userTokenX.balance(),
      20_999_993_000_000n + 1_000_000n - 1960n // original amount + swap out amount - fee
    );

    assert.strictEqual(
      await accounts.userTokenY.balance(),
      99_780_872_860_360n - 36_510_755_314n // original amount - swap in amount
    );
  });

  it("should swap (cpmm) from btc to usd (x to y) for a third party wallet", async () => {
    let newUserWallet = Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        newUserWallet.publicKey,
        10000000000
      ),
      "confirmed"
    );

    assert.strictEqual(
      await provider.connection.getBalance(newUserWallet.publicKey),
      10000000000
    );

    let newUserBtcdAccount = await sdk.common.createAssociatedAccount(
      btcdMint,
      newUserWallet
    );

    let newUserUsddAccount = await sdk.common.createAssociatedAccount(
      usddMint,
      newUserWallet
    );

    await sdk.common.transfer(btcdAccount, newUserBtcdAccount, 1_000_000n);

    await sdk.common.transfer(
      usddAccount,
      newUserUsddAccount,
      100_000_000_000n
    );

    let accounts = await sdk.liquidityPools.accounts.getAccountLoaders(
      btcdMint,
      usddMint
    );

    // TODO: add into sdk
    await sdk.ctx.programs.hydraLiquidityPools.rpc.swap(
      toBN(500_000n),
      toBN(18_255_377_657n),
      {
        accounts: {
          user: newUserWallet.publicKey,
          tokenXMint: btcdMint,
          tokenYMint: usddMint,
          poolState: await accounts.poolState.key(),
          lpTokenMint: await accounts.lpTokenMint.key(),
          userFromToken: newUserBtcdAccount,
          userToToken: newUserUsddAccount,
          userToMint: usddMint,
          tokenXVault: await accounts.tokenXVault.key(),
          tokenYVault: await accounts.tokenYVault.key(),
          systemProgram: SystemProgram.programId,
          tokenProgram: SPLToken.TOKEN_PROGRAM_ID,
          associatedTokenProgram: SPLToken.ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: web3.SYSVAR_RENT_PUBKEY,
        },
        signers: [newUserWallet],
      }
    );

    assert.strictEqual(
      await AccountLoader.Token(sdk.ctx, newUserBtcdAccount).balance(),
      1_000_000n - 500_000n
    );

    assert.strictEqual(
      await AccountLoader.Token(sdk.ctx, newUserUsddAccount).balance(),
      100_000_000_000n + 19_622_226_499n
    );

    assert.strictEqual(
      await accounts.tokenXVault.balance(),
      6_001_960n + 500_000n // original + swap
    );

    assert.strictEqual(
      await accounts.tokenYVault.balance(),
      255_637_894_954n - 19_622_226_499n // original - swap
    );
  });

  it("should remove-liquidity for the last time", async () => {
    const accounts = await sdk.liquidityPools.accounts.getAccountLoaders(
      btcdMint,
      usddMint
    );

    await sdk.liquidityPools.removeLiquidity(btcdMint, usddMint, 1238326078n);

    assert.strictEqual(await accounts.lpTokenAssociatedAccount.balance(), 0n);

    assert.strictEqual(await accounts.lpTokenVault.balance(), 100n);

    assert.strictEqual(await accounts.tokenXVault.balance(), 0n);

    assert.strictEqual(await accounts.tokenYVault.balance(), 19_059n);
  });
});
