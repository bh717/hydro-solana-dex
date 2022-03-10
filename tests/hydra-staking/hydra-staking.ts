import * as anchor from "@project-serum/anchor";
import config from "config-ts/global-config.json";
import { HydraStaking, IDL } from "types-ts/codegen/types/hydra_staking";
import { Keypair } from "@solana/web3.js";
import * as assert from "assert";
import { HydraSDK } from "hydra-ts";

describe("hydra-staking", () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const programId = new anchor.web3.PublicKey(
    config.localnet.programIds.hydraStaking
  );
  const program = new anchor.Program<HydraStaking>(IDL, programId);

  let tokenMint = anchor.web3.Keypair.generate();
  let redeemableMint = anchor.web3.Keypair.generate();
  let userAccount = Keypair.generate();
  let sdk: HydraSDK;

  before(async () => {
    sdk = HydraSDK.createFromAnchorProvider(provider, {
      hydraStaking: program.programId.toString(),
      redeemableMint: redeemableMint.publicKey.toString(),
      tokenMint: tokenMint.publicKey.toString(),
    });

    // create tokenMint
    await sdk.common.createMintAndVault(tokenMint, userAccount, 100_000_000n);

    // get PDA for tokenVault
    const tokenVaultPubkey = await sdk.staking.accounts.tokenVault.key();
    const tokenVaultBump = await sdk.staking.accounts.tokenVault.bump();

    // create redeemableMint and redeemableTokenAccount
    await sdk.common.createMint(redeemableMint, tokenVaultPubkey);
    await sdk.common.createTokenAccount(
      redeemableMint.publicKey,
      program.provider.wallet.publicKey
    );

    // get PDA for statePool
    const poolStateBump = await sdk.staking.accounts.poolState.bump();

    // initialize
    await sdk.staking.initialize(tokenVaultBump, poolStateBump);
  });

  it("should be setup correctly", async () => {
    assert.strictEqual(await sdk.staking.accounts.userRedeemable.bal(), 0n);
    assert.strictEqual(await sdk.staking.accounts.tokenVault.bal(), 0n);
    assert.strictEqual(
      await sdk.staking.accounts.userToken.bal(),
      100_000_000n
    );
  });

  it("should stake tokens into token_vault for the first time", async () => {
    await sdk.staking.stake(1000n);
    assert.strictEqual(await sdk.staking.accounts.userRedeemable.bal(), 1000n);
    assert.strictEqual(await sdk.staking.accounts.tokenVault.bal(), 1000n);
    assert.strictEqual(await sdk.staking.accounts.userToken.bal(), 99999000n);
  });

  it("should stake tokens into the token_vault for a second time", async () => {
    await sdk.staking.stake(4000n);
    assert.strictEqual(await sdk.staking.accounts.userRedeemable.bal(), 5000n);
    assert.strictEqual(await sdk.staking.accounts.tokenVault.bal(), 5000n);
    assert.strictEqual(await sdk.staking.accounts.userToken.bal(), 99995000n);
  });

  it("should transfer tokens into the vault directly", async () => {
    await sdk.common.transfer(
      await sdk.staking.accounts.userToken.key(),
      await sdk.staking.accounts.tokenVault.key(),
      99995000
    );
    assert.strictEqual(await sdk.staking.accounts.tokenVault.bal(), 100000000n);
    assert.strictEqual(await sdk.staking.accounts.userRedeemable.bal(), 5000n);
    assert.strictEqual(await sdk.staking.accounts.userToken.bal(), 0n);
  });

  it("should unStake 100% of the vault", async () => {
    await sdk.staking.unstake(5000n);

    assert.strictEqual(await sdk.staking.accounts.tokenVault.bal(), 0n);
    assert.strictEqual(await sdk.staking.accounts.userRedeemable.bal(), 0n);
    assert.strictEqual(await sdk.staking.accounts.userToken.bal(), 100000000n);
  });
});
