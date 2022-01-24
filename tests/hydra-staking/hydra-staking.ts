import * as anchor from '@project-serum/anchor';
import {BN, Program} from '@project-serum/anchor';
import { HydraStaking } from '../../target/types/hydra_staking';
import {loadKey, createMintAndVault, createMint, getTokenBalance, transfer} from "../utils/utils"
import { TokenInstructions } from "@project-serum/serum"
import {Keypair} from "@solana/web3.js";
import {createTokenAccount, NodeWallet} from "@project-serum/common";
import {TOKEN_PROGRAM_ID} from "@project-serum/serum/lib/token-instructions";
import * as assert from "assert";
const utf8 = anchor.utils.bytes.utf8;

describe('hydra-staking',  async () => {
    anchor.setProvider(anchor.Provider.env());
    const program = anchor.workspace.HydraStaking as Program<HydraStaking>;

    let tokenMint
    let redeemableMint

    let tokenVaultPubkey
    let tokenVaultBump

    let TokenAccount = Keypair.generate()
    let redeemableTokenAccount

    let poolStatePubkey
    let poolStateBump

    it('should load mint keys', async () => {
        tokenMint = await loadKey("tests/keys/hyd3VthE9YPGBeg9HEgZsrM5qPniC6VoaEFeTGkVsJR.json")
        redeemableMint = await loadKey("tests/keys/xhy1rv75cEJahTbsKnv2TpNhdR7KNUoDPavKuQDwhDU.json")
    });

    it('should create tokenMint', async () => {
        await createMintAndVault(program.provider, tokenMint, TokenAccount, new anchor.BN(100_000_000))
    })

    it('should get PDA for tokenVault', async () => {
        [tokenVaultPubkey, tokenVaultBump] = await anchor.web3.PublicKey.findProgramAddress(
            [utf8.encode("token_vault_seed"), tokenMint.publicKey.toBuffer(), redeemableMint.publicKey.toBuffer()],
            program.programId
        );
    });

    it('should create redeemableMint and redeemableTokenAccount', async () => {
        await createMint(program.provider, redeemableMint, tokenVaultPubkey)
        redeemableTokenAccount = await createTokenAccount(program.provider, redeemableMint.publicKey, program.provider.wallet.publicKey)
    });

    it('should get PDA for statePool', async () => {
        [poolStatePubkey, poolStateBump] = await anchor.web3.PublicKey.findProgramAddress(
            [utf8.encode("pool_state_seed"), tokenMint.publicKey.toBuffer(), redeemableMint.publicKey.toBuffer()],
            program.programId
        );
    });


    it('should initialized Staking contract\'s PDA, state and token_vault', async () => {
        await program.rpc.initialize(
            tokenVaultBump,
            poolStateBump,
            {
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


    it('should stake tokens into token_vault for the first time', async () => {
        await program.rpc.stake(
            new anchor.BN(1000),
            {
                accounts: {
                    poolState: poolStatePubkey ,
                    tokenMint: tokenMint.publicKey,
                    redeemableMint: redeemableMint.publicKey,
                    userFrom: TokenAccount.publicKey,
                    userFromAuthority: program.provider.wallet.publicKey,
                    tokenVault: tokenVaultPubkey,
                    redeemableTo: redeemableTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                },
                signers: [(program.provider.wallet as NodeWallet).payer]
            }
        )
        assert.strictEqual(await getTokenBalance(program.provider, redeemableTokenAccount), 1000)
        assert.strictEqual(await getTokenBalance(program.provider, tokenVaultPubkey), 1000)
        assert.strictEqual(await getTokenBalance(program.provider, TokenAccount.publicKey), 99999000)
    });

    it('should stake tokens into the token_vault for a second time', async () => {
        await program.rpc.stake(
            new anchor.BN(4000),
            {
                accounts: {
                    poolState: poolStatePubkey,
                    tokenMint: tokenMint.publicKey,
                    redeemableMint: redeemableMint.publicKey,
                    userFrom: TokenAccount.publicKey,
                    userFromAuthority: program.provider.wallet.publicKey,
                    tokenVault: tokenVaultPubkey,
                    redeemableTo: redeemableTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                }
            }
        )
        assert.strictEqual(await getTokenBalance(program.provider, redeemableTokenAccount), 5000)
        assert.strictEqual(await getTokenBalance(program.provider, tokenVaultPubkey), 5000)
        assert.strictEqual(await getTokenBalance(program.provider, TokenAccount.publicKey), 99995000)
    });

    it('should emit the current price', async () => {
        await program.rpc.emitPrice({
            accounts: {
                poolState: poolStatePubkey,
                tokenMint: tokenMint.publicKey,
                redeemableMint: redeemableMint.publicKey,
                tokenVault: tokenVaultPubkey,
            }
        })

    });

    it('should transfer tokens into the vault directly', async () => {
        await transfer(
            program.provider,
            TokenAccount.publicKey,
            tokenVaultPubkey,
            99995000,
        )
        assert.strictEqual(await getTokenBalance(program.provider, tokenVaultPubkey), 100000000)
        assert.strictEqual(await getTokenBalance(program.provider, redeemableTokenAccount), 5000)
        assert.strictEqual(await getTokenBalance(program.provider, TokenAccount.publicKey), 0)
    });

    it('should emit the next price', async () => {
        await program.rpc.emitPrice({
            accounts: {
                poolState: poolStatePubkey,
                tokenMint: tokenMint.publicKey,
                redeemableMint: redeemableMint.publicKey,
                tokenVault: tokenVaultPubkey,
            }
        })
    });

    it('should unStake 100% of the vault', async () => {
        await program.rpc.unstake (
            new anchor.BN(5000),
            {
                accounts: {
                    poolState: poolStatePubkey,
                    tokenMint: tokenMint.publicKey,
                    redeemableMint: redeemableMint.publicKey,
                    userTo: TokenAccount.publicKey,
                    tokenVault: tokenVaultPubkey,
                    redeemableFrom: redeemableTokenAccount,
                    redeemableFromAuthority: program.provider.wallet.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                }
            }
        )
        assert.strictEqual(await getTokenBalance(program.provider, redeemableTokenAccount), 0)
        assert.strictEqual(await getTokenBalance(program.provider, tokenVaultPubkey), 0)
        assert.strictEqual(await getTokenBalance(program.provider, TokenAccount.publicKey), 100000000)
    });
});
