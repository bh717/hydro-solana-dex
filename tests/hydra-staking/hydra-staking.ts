import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
import * as localJsonIdl from "../../target/idl/hydra_staking.json";
import { HydraStaking, IDL } from "types-ts/codegen/types/hydra_staking";

import {
  createMintAndVault,
  createMint,
  transfer,
} from "../../sdks/hydra-utils-ts/node";
import { TokenInstructions } from "@project-serum/serum";
import { Keypair, PublicKey } from "@solana/web3.js";
import { createTokenAccount, NodeWallet } from "@project-serum/common";
// import { TOKEN_PROGRAM_ID } from "@project-serum/serum/lib/token-instructions";
import * as assert from "assert";
import { createApi, createCtxAnchor, HydraAPI } from "hydra-ts";
import { loadKey } from "../../sdks/hydra-utils-ts/node";
import { getPDA, getTokenBalance } from "hydra-ts/src/utils/utils";
// const utf8 = anchor.utils.bytes.utf8;

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
    [tokenVaultPubkey, tokenVaultBump] = await getPDA(program.programId, [
      "token_vault_seed",
      tokenMint.publicKey,
      redeemableMint.publicKey,
    ]);

    // create redeemableMint and redeemableTokenAccount
    await createMint(program.provider, redeemableMint, tokenVaultPubkey);
    redeemableTokenAccount = await createTokenAccount(
      program.provider,
      redeemableMint.publicKey,
      program.provider.wallet.publicKey
    );

    // get PDA for statePool
    [poolStatePubkey, poolStateBump] = await await getPDA(program.programId, [
      "pool_state_seed",
      tokenMint.publicKey,
      redeemableMint.publicKey,
    ]);

    // initialized Staking contract's PDA, state and token_vault
    await program.rpc.initialize(tokenVaultBump, poolStateBump, {
      accounts: {
        authority: program.provider.wallet.publicKey,
        tokenMint: tokenMint.publicKey,
        redeemableMint: redeemableMint.publicKey,
        poolState: poolStatePubkey,
        tokenVault: tokenVaultPubkey,
        payer: program.provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [(program.provider.wallet as NodeWallet).payer],
    });
  });

  it("should stake tokens into token_vault for the first time", async () => {
    await sdk.staking.stake(1000n);

    assert.strictEqual(
      (
        await getTokenBalance(program.provider, redeemableTokenAccount)
      ).toNumber(),
      1000
    );
    assert.strictEqual(
      (await getTokenBalance(program.provider, tokenVaultPubkey)).toNumber(),
      1000
    );
    assert.strictEqual(
      (
        await getTokenBalance(program.provider, TokenAccount.publicKey)
      ).toNumber(),
      99999000
    );
  });

  it("should stake tokens into the token_vault for a second time", async () => {
    await sdk.staking.stake(4000n);

    assert.strictEqual(
      (
        await getTokenBalance(program.provider, redeemableTokenAccount)
      ).toNumber(),
      5000
    );
    assert.strictEqual(
      (await getTokenBalance(program.provider, tokenVaultPubkey)).toNumber(),
      5000
    );
    assert.strictEqual(
      (
        await getTokenBalance(program.provider, TokenAccount.publicKey)
      ).toNumber(),
      99995000
    );
  });

  it("should transfer tokens into the vault directly", async () => {
    await transfer(
      program.provider,
      TokenAccount.publicKey,
      tokenVaultPubkey,
      99995000
    );
    assert.strictEqual(
      (await getTokenBalance(program.provider, tokenVaultPubkey)).toNumber(),
      100000000
    );
    assert.strictEqual(
      (
        await getTokenBalance(program.provider, redeemableTokenAccount)
      ).toNumber(),
      5000
    );
    assert.strictEqual(
      (
        await getTokenBalance(program.provider, TokenAccount.publicKey)
      ).toNumber(),
      0
    );
  });

  it("should unStake 100% of the vault", async () => {
    await sdk.staking.unstake(5000n);

    assert.strictEqual(
      (
        await getTokenBalance(program.provider, redeemableTokenAccount)
      ).toNumber(),
      0
    );
    assert.strictEqual(
      (await getTokenBalance(program.provider, tokenVaultPubkey)).toNumber(),
      0
    );
    assert.strictEqual(
      (
        await getTokenBalance(program.provider, TokenAccount.publicKey)
      ).toNumber(),
      100000000
    );
  });
});
