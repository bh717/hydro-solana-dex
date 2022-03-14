import * as anchor from "@project-serum/anchor";
import config from "config-ts/global-config.json";
import { Keypair } from "@solana/web3.js";
import * as assert from "assert";
import { HydraSDK } from "hydra-ts";
import { stringifyProps } from "hydra-ts/src/utils";

describe("hydra-staking", () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  let tokenMint = Keypair.generate();
  let redeemableMint = Keypair.generate();

  let sdk: HydraSDK;
  let tokenVaultBump: number;
  let poolStateBump: number;
  before(async () => {
    sdk = HydraSDK.createFromAnchorProvider(provider, {
      ...config.localnet.programIds,
      hydraStaking: config.localnet.programIds.hydraStaking,
      redeemableMint: redeemableMint.publicKey.toString(),
      tokenMint: tokenMint.publicKey.toString(),
    });

    await sdk.common.createMintAndAssociatedVault(tokenMint, 100_000_000n);

    const tokenVaultPubkey = await sdk.staking.accounts.tokenVault.key();
    tokenVaultBump = await sdk.staking.accounts.tokenVault.bump();

    // create redeemableMint and redeemableTokenAccount
    await sdk.common.createMint(redeemableMint, tokenVaultPubkey);

    // get PDA for statePool
    poolStateBump = await sdk.staking.accounts.poolState.bump();

    // initialize
    await sdk.staking.initialize(tokenVaultBump, poolStateBump);
  });

  it("should be setup correctly", async () => {
    assert.deepEqual(
      stringifyProps((await sdk.staking.accounts.poolState.info()).data),
      {
        authority: `${sdk.ctx.provider.wallet.publicKey}`,
        poolStateBump: `${poolStateBump}`,
        redeemableMint: `${redeemableMint.publicKey}`,
        tokenMint: `${tokenMint.publicKey}`,
        tokenMintDecimals: `6`,
        tokenVaultBump: `${tokenVaultBump}`,
        tokenVault: `${await sdk.staking.accounts.tokenVault.key()}`,
      }
    );
    assert.strictEqual(await sdk.staking.accounts.tokenVault.balance(), 0n);
    assert.strictEqual(
      await sdk.staking.accounts.userToken.balance(),
      100_000_000n
    );
  });

  it("should stake tokens into token_vault for the first time", async () => {
    await sdk.staking.stake(1000n);
    assert.strictEqual(
      await sdk.staking.accounts.userRedeemable.balance(),
      1000n
    );

    assert.strictEqual(await sdk.staking.accounts.tokenVault.balance(), 1000n);
    assert.strictEqual(
      await sdk.staking.accounts.userToken.balance(),
      99999000n
    );
  });

  it("should stake tokens into the token_vault for a second time", async () => {
    await sdk.staking.stake(4000n);
    assert.strictEqual(
      await sdk.staking.accounts.userRedeemable.balance(),
      5000n
    );
    assert.strictEqual(await sdk.staking.accounts.tokenVault.balance(), 5000n);
    assert.strictEqual(
      await sdk.staking.accounts.userToken.balance(),
      99995000n
    );
  });

  it("should transfer tokens into the vault directly", async () => {
    await sdk.common.transfer(
      await sdk.staking.accounts.userToken.key(),
      await sdk.staking.accounts.tokenVault.key(),
      99995000
    );
    assert.strictEqual(
      await sdk.staking.accounts.tokenVault.balance(),
      100000000n
    );
    assert.strictEqual(
      await sdk.staking.accounts.userRedeemable.balance(),
      5000n
    );
    assert.strictEqual(await sdk.staking.accounts.userToken.balance(), 0n);
  });

  it("should unStake 100% of the vault", async () => {
    await sdk.staking.unstake(5000n);

    assert.strictEqual(await sdk.staking.accounts.tokenVault.balance(), 0n);
    assert.strictEqual(await sdk.staking.accounts.userRedeemable.balance(), 0n);
    assert.strictEqual(
      await sdk.staking.accounts.userToken.balance(),
      100000000n
    );
  });
});
