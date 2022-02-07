import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
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

    const tokenMint = Keypair.generate()
    const redeemableMint = Keypair.generate()

    let tokenVaultPubkey
    let tokenVaultBump

    let TokenAccount = Keypair.generate()
    let redeemableTokenAccount

    let poolStatePubkey
    let poolStateBump

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

    it('should initialize hydra-staking contract', async () => {
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
        assert.strictEqual((await getTokenBalance(program.provider, redeemableTokenAccount)).toNumber(), 1000)
        assert.strictEqual((await getTokenBalance(program.provider, tokenVaultPubkey)).toNumber(), 1000)
        assert.strictEqual((await getTokenBalance(program.provider, TokenAccount.publicKey)).toNumber(), 99999000)
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
        assert.strictEqual((await getTokenBalance(program.provider, redeemableTokenAccount)).toNumber(), 5000)
        assert.strictEqual((await getTokenBalance(program.provider, tokenVaultPubkey)).toNumber(), 5000)
        assert.strictEqual((await getTokenBalance(program.provider, TokenAccount.publicKey)).toNumber(), 99995000)
    });

    it('should transfer tokens into the vault directly', async () => {
        await transfer(
            program.provider,
            TokenAccount.publicKey,
            tokenVaultPubkey,
            99995000,
        )
        assert.strictEqual((await getTokenBalance(program.provider, tokenVaultPubkey)).toNumber(), 100000000)
        assert.strictEqual((await getTokenBalance(program.provider, redeemableTokenAccount)).toNumber(), 5000)
        assert.strictEqual((await getTokenBalance(program.provider, TokenAccount.publicKey)).toNumber(), 0)
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
        assert.strictEqual((await getTokenBalance(program.provider, redeemableTokenAccount)).toNumber(), 0)
        assert.strictEqual((await getTokenBalance(program.provider, tokenVaultPubkey)).toNumber(), 0)
        assert.strictEqual((await getTokenBalance(program.provider, TokenAccount.publicKey)).toNumber(), 100000000)
    });
});
