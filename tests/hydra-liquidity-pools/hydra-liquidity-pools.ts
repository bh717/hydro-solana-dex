import * as anchor from "@project-serum/anchor";
import { BN } from "@project-serum/anchor";
import config from "config-ts/global-config.json";
import * as liquidityPools from "types-ts/codegen/types/hydra_liquidity_pools";
import assert from "assert";
import { Keypair, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@project-serum/serum/lib/token-instructions";
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

  let sdk: HydraSDK;

  const hydraLiquidityPoolsProgramId = new anchor.web3.PublicKey(
    config.localnet.programIds.hydraLiquidityPools
  );
  const program = new anchor.Program(
    liquidityPools.IDL,
    hydraLiquidityPoolsProgramId
  );

  const lpTokenMint = Keypair.generate();
  let btcdMint: PublicKey;
  let usddMint: PublicKey;
  let btcdAccount: PublicKey;
  let usddAccount: PublicKey;
  let lpTokenAssociatedAccount: PublicKey;

  let poolState: PublicKey;
  let tokenXVault: PublicKey;
  let tokenYVault: PublicKey;
  let lpTokenVault: PublicKey;

  let poolStateBump: number;
  let tokenXVaultBump: number;
  let tokenYVaultBump: number;
  let lpTokenVaultBump: number;
  let poolStateAccount: any;

  let poolFees: any; // XXX

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
      BigInt(btcdMintAmount.toString())
    );

    [usddMint, usddAccount] = await sdk.common.createMintAndAssociatedVault(
      usddMintPair,
      BigInt(usddMintAmount.toString())
    );

    // get the PDA for the PoolState
    poolState = await accounts.poolState.key();
    poolStateBump = await accounts.poolState.bump();

    // create lpTokenMint with poolState as the authority and a lpTokenAssociatedAccount
    await sdk.common.createMint(lpTokenMint, poolState, 9);
    lpTokenAssociatedAccount = await sdk.common.createAssociatedAccount(
      lpTokenMint.publicKey
    );
    tokenXVault = await accounts.tokenXVault.key();
    tokenXVaultBump = await accounts.tokenXVault.bump();
    tokenYVault = await accounts.tokenYVault.key();
    tokenYVaultBump = await accounts.tokenYVault.bump();
    lpTokenVault = await accounts.lpTokenVault.key();
    lpTokenVaultBump = await accounts.lpTokenVault.bump();
  });

  it("should initialize a liquidity-pool", async () => {
    poolFees = {
      swapFeeNumerator: new BN(1),
      swapFeeDenominator: new BN(500),
      ownerTradeFeeNumerator: new BN(0),
      ownerTradeFeeDenominator: new BN(0),
      ownerWithdrawFeeNumerator: new BN(0),
      ownerWithdrawFeeDenominator: new BN(0),
      hostFeeNumerator: new BN(0),
      hostFeeDenominator: new BN(0),
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

    const accounts = await sdk.liquidityPools.accounts.getInitAccountLoaders(
      btcdMint,
      usddMint,
      lpTokenMint.publicKey
    );

    assert.strictEqual(
      await accounts.lpTokenAssociatedAccount.balance(),
      1238326078n
    );

    assert.strictEqual(
      (await getTokenBalance(provider, btcdAccount)).toNumber(),
      btcdMintAmount.toNumber() - 6_000_000
    );

    assert.strictEqual(
      (await getTokenBalance(provider, usddAccount)).toNumber(),
      usddMintAmount.toNumber() - 255_575_287_200
    );
    assert.strictEqual(
      (await getTokenBalance(provider, lpTokenVault)).toNumber(),
      100
    );
    assert.strictEqual(
      (await getTokenBalance(provider, tokenXVault)).toNumber(),
      6000000
    );
    assert.strictEqual(
      (await getTokenBalance(provider, tokenYVault)).toNumber(),
      255575287200
    );
  });

  it("should not add-liquidity on a second deposit with the 0 expected_lp_tokens", async () => {
    await sdk.liquidityPools.addLiquidity(
      6_000_000n,
      255_575_287_200n,
      0n,
      lpTokenMint.publicKey
    );

    // no changes from last test case.
    assert.strictEqual(
      (await getTokenBalance(provider, lpTokenAssociatedAccount)).toNumber(),
      1238326078
    );
    assert.strictEqual(
      (await getTokenBalance(provider, btcdAccount)).toNumber(),
      btcdMintAmount.toNumber() - 6_000_000
    );
    assert.strictEqual(
      (await getTokenBalance(provider, usddAccount)).toNumber(),
      usddMintAmount.toNumber() - 255_575_287_200
    );
    assert.strictEqual(
      (await getTokenBalance(provider, lpTokenVault)).toNumber(),
      100
    );
    assert.strictEqual(
      (await getTokenBalance(provider, tokenXVault)).toNumber(),
      6000000
    );
    assert.strictEqual(
      (await getTokenBalance(provider, tokenYVault)).toNumber(),
      255575287200
    );
  });

  it("should add-liquidity to pool for the second time", async () => {
    await sdk.liquidityPools.addLiquidity(
      16_000_000n, // 16 bitcoins
      681_534_099_132n, // $681,534.099132 usdc
      3_302_203_141n,
      lpTokenMint.publicKey
    );
    assert.strictEqual(
      (await getTokenBalance(provider, lpTokenAssociatedAccount)).toNumber(),
      1238326078 + 3302203141
    );
    assert.strictEqual(
      (await getTokenBalance(provider, btcdAccount)).toNumber(),
      btcdMintAmount.toNumber() - 6_000_000 - 16_000_000 // first add - second add
    );
    assert.strictEqual(
      (await getTokenBalance(provider, usddAccount)).toNumber(),
      usddMintAmount.toNumber() - 255_575_287_200 - 681_534_099_132 // first add - second add
    );
    assert.strictEqual(
      (await getTokenBalance(provider, lpTokenVault)).toNumber(),
      100
    ); // no change
    assert.strictEqual(
      (await getTokenBalance(provider, tokenXVault)).toNumber(),
      6000000 + 16000000
    );
    assert.strictEqual(
      (await getTokenBalance(provider, tokenYVault)).toNumber(),
      255575287200 + 681534099132
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

    // no change from last test
    assert.strictEqual(
      (await getTokenBalance(provider, lpTokenAssociatedAccount)).toNumber(),
      1238326078 + 3302203141
    );
    assert.strictEqual(
      (await getTokenBalance(provider, btcdAccount)).toNumber(),
      btcdMintAmount.toNumber() - 6_000_000 - 16_000_000 // first add - second add
    );
    assert.strictEqual(
      (await getTokenBalance(provider, usddAccount)).toNumber(),
      usddMintAmount.toNumber() - 255_575_287_200 - 681_534_099_132 // first add - second add
    );
    assert.strictEqual(
      (await getTokenBalance(provider, lpTokenVault)).toNumber(),
      100
    );
    // no change
    assert.strictEqual(
      (await getTokenBalance(provider, tokenXVault)).toNumber(),
      6000000 + 16000000
    );
    assert.strictEqual(
      (await getTokenBalance(provider, tokenYVault)).toNumber(),
      255575287200 + 681534099132
    );
  });

  it("should remove-liquidity first time", async () => {
    await sdk.liquidityPools.removeLiquidity(
      3_302_203_141n,
      lpTokenMint.publicKey
    );

    assert.strictEqual(
      (await getTokenBalance(provider, lpTokenAssociatedAccount)).toNumber(),
      1238326078
    );

    assert.strictEqual(
      (await getTokenBalance(provider, tokenXVault)).toNumber(),
      6_000_000
    );

    assert.strictEqual(
      (await getTokenBalance(provider, tokenYVault)).toNumber(),
      255575287200
    );
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

    assert.strictEqual(
      (await getTokenBalance(provider, tokenXVault)).toNumber(),
      6_000_000 + 1_000_000 + 2000 // original amount + swap in amount + fee
    );

    assert.strictEqual(
      (await getTokenBalance(provider, tokenYVault)).toNumber(),
      255_575_287_200 - 36_510_755_314 // original amount - swap out amount
>>>>>>> 48aabc1 (Add SDK to hydraliquiditypools)
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
  //
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
    await sdk.liquidityPools.removeLiquidity(
      1238326078n,
      lpTokenMint.publicKey
    );

    assert.strictEqual(
      (await getTokenBalance(provider, lpTokenAssociatedAccount)).toNumber(),
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
      100_000_000_000_000 - 17695 // Always left in the pool.
    );
  });
});
