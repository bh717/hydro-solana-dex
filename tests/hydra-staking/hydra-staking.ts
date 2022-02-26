import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import * as localJsonIdl from "target/idl/hydra_staking.json";
import { HydraStaking, IDL } from "types-ts/codegen/types/hydra_staking";
import {
  loadKey,
  createMintAndVault,
  createMint,
  transfer,
} from "hydra-ts/node";
import { TokenInstructions } from "@project-serum/serum";
import { Keypair, PublicKey } from "@solana/web3.js";
import { createTokenAccount, NodeWallet } from "@project-serum/common";
import * as assert from "assert";
import { HydraAPI, createApi, createCtxAnchor } from "hydra-ts";
describe("hydra-staking", () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const programId = new anchor.web3.PublicKey(
    localJsonIdl["metadata"]["address"]
  );
  // const program = anchor.workspace.HydraStaking as Program<HydraStaking>;
  const program = new anchor.Program(IDL, programId) as Program<HydraStaking>;
  let tokenMint: Keypair;
  let redeemableMint: Keypair;

  let tokenVaultPubkey: PublicKey;
  let tokenVaultBump: number;

  let TokenAccount = Keypair.generate();
  let redeemableTokenAccount: PublicKey;

  let poolStatePubkey: PublicKey;
  let poolStateBump: number;
  let sdk: HydraAPI;

  before(async () => {
    // load mint keys
    tokenMint = await loadKey(
      "keys/localnet/staking/hyd3VthE9YPGBeg9HEgZsrM5qPniC6VoaEFeTGkVsJR.json"
    );
    redeemableMint = await loadKey(
      "keys/localnet/staking/xhy1rv75cEJahTbsKnv2TpNhdR7KNUoDPavKuQDwhDU.json"
    );

    sdk = createApi(
      createCtxAnchor(provider, {
        hydraStaking: program.programId.toString(),
        redeemableMint: redeemableMint.publicKey.toString(),
        tokenMint: tokenMint.publicKey.toString(),
      })
    );

    // create tokenMint
    await createMintAndVault(
      program.provider,
      tokenMint,
      TokenAccount,
      new anchor.BN(100_000_000)
    );

    // get PDA for tokenVault
    [tokenVaultPubkey, tokenVaultBump] = await sdk.utils.getPDA(
      program.programId,
      ["token_vault_seed", tokenMint.publicKey, redeemableMint.publicKey]
    );

    // create redeemableMint and redeemableTokenAccount
    await createMint(program.provider, redeemableMint, tokenVaultPubkey);
    redeemableTokenAccount = await createTokenAccount(
      program.provider,
      redeemableMint.publicKey,
      program.provider.wallet.publicKey
    );

    // get PDA for statePool
    [poolStatePubkey, poolStateBump] = await sdk.utils.getPDA(
      program.programId,
      ["pool_state_seed", tokenMint.publicKey, redeemableMint.publicKey]
    );
    // sdk.staking.stake()
    await sdk.staking.initialize(tokenVaultBump, poolStateBump);
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
    await transfer(
      program.provider,
      TokenAccount.publicKey,
      tokenVaultPubkey,
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
