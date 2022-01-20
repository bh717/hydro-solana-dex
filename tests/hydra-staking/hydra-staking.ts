import * as anchor from '@project-serum/anchor';
import {BN, Program} from '@project-serum/anchor';
import { HydraStaking } from '../../target/types/hydra_staking';
import {loadKey, createMintAndVault, createMint, getTokenBalance, transfer} from "../utils/utils"
import { TokenInstructions } from "@project-serum/serum"
import {Keypair} from "@solana/web3.js";
import {createTokenAccount, NodeWallet} from "@project-serum/common";
import {TOKEN_PROGRAM_ID} from "@project-serum/serum/lib/token-instructions";
import * as assert from "assert";

describe('hydra-staking',  () => {
    anchor.setProvider(anchor.Provider.env());
    const program = anchor.workspace.HydraStaking as Program<HydraStaking>;

    let hydMint
    let xhydMint

    let vaultPubkey
    let vaultBump

    let hydTokenAccount = Keypair.generate()
    let xHydAccount

    let statePoolPubkey
    let stateBump

    it('should mint Hyd', async () => {
        // load keyPair
        hydMint = await loadKey("tests/keys/hyd3VthE9YPGBeg9HEgZsrM5qPniC6VoaEFeTGkVsJR.json")
        await createMintAndVault(program.provider, hydMint, hydTokenAccount, new anchor.BN(100_000_000))
    })

    it('should get PDA address details', async () => {
        [vaultPubkey, vaultBump] = await anchor.web3.PublicKey.findProgramAddress(
            [hydMint.publicKey.toBuffer()],
            program.programId
        );

        [statePoolPubkey, stateBump] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("state_seed")],
            program.programId
        );
    });

    it('should create xhyd mint and minto hydAccount', async () => {
        xhydMint = await loadKey("tests/keys/xhy1rv75cEJahTbsKnv2TpNhdR7KNUoDPavKuQDwhDU.json")
        await createMint(program.provider, xhydMint, vaultPubkey)
        xHydAccount = await createTokenAccount(program.provider, xhydMint.publicKey, program.provider.wallet.publicKey)
    });

    it('should initialized Staking contract\'s PDA, state and token_vault', async () => {
        await program.rpc.initialize(
            vaultBump,
            stateBump,
            {
                accounts: {
                    authority: program.provider.wallet.publicKey,
                    tokenMint: hydMint.publicKey,
                    redeemableMint: xhydMint.publicKey,
                    state: statePoolPubkey,
                    tokenVault: vaultPubkey,
                    payer: program.provider.wallet.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                },
                signers: [(program.provider.wallet as NodeWallet).payer],
            });
    });


    it('should stake tokens into vault for the first time', async () => {
        await program.rpc.stake(
            vaultBump,
            stateBump,
            new anchor.BN(1000),
            {
                accounts: {
                    state: statePoolPubkey ,
                    tokenMint: hydMint.publicKey,
                    redeemableMint: xhydMint.publicKey,
                    userFrom: hydTokenAccount.publicKey,
                    userFromAuthority: program.provider.wallet.publicKey,
                    tokenVault: vaultPubkey,
                    redeemableTo: xHydAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                },
                signers: [(program.provider.wallet as NodeWallet).payer]
            }
        )
        assert.strictEqual(await getTokenBalance(program.provider, xHydAccount), 1000)
        assert.strictEqual(await getTokenBalance(program.provider, vaultPubkey), 1000)
        assert.strictEqual(await getTokenBalance(program.provider, hydTokenAccount.publicKey), 99999000)
    });

    it('should stake tokens into the vault for a second time', async () => {
        await program.rpc.stake(
            vaultBump,
            stateBump,
            new anchor.BN(4000),
            {
                accounts: {
                    state: statePoolPubkey,
                    tokenMint: hydMint.publicKey,
                    redeemableMint: xhydMint.publicKey,
                    userFrom: hydTokenAccount.publicKey,
                    userFromAuthority: program.provider.wallet.publicKey,
                    tokenVault: vaultPubkey,
                    redeemableTo: xHydAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                }
            }
        )
        assert.strictEqual(await getTokenBalance(program.provider, xHydAccount), 5000)
        assert.strictEqual(await getTokenBalance(program.provider, vaultPubkey), 5000)
        assert.strictEqual(await getTokenBalance(program.provider, hydTokenAccount.publicKey), 99995000)
    });
    //
    it('should emit the current price', async () => {
        await program.rpc.emitPrice(stateBump, {
            accounts: {
                state: statePoolPubkey,
               tokenMint: hydMint.publicKey,
               redeemableMint: xhydMint.publicKey,
               tokenVault: vaultPubkey,
            }
        })

    });

    it('should transfer tokens into the vault directly', async () => {
        await transfer(
            program.provider,
            hydTokenAccount.publicKey,
            vaultPubkey,
            99995000,
        )
        assert.strictEqual(await getTokenBalance(program.provider, vaultPubkey), 100000000)
        assert.strictEqual(await getTokenBalance(program.provider, xHydAccount), 5000)
        assert.strictEqual(await getTokenBalance(program.provider, hydTokenAccount.publicKey), 0)
    });

    it('should emit the next price', async () => {
        await program.rpc.emitPrice(stateBump, {
            accounts: {
                state: statePoolPubkey,
                tokenMint: hydMint.publicKey,
                redeemableMint: xhydMint.publicKey,
                tokenVault: vaultPubkey,
            }
        })
    });

    it('should unStake 100% of the vault', async () => {
        await program.rpc.unstake (
            vaultBump,
            stateBump,
            new anchor.BN(5000),
            {
                accounts: {
                    state: statePoolPubkey,
                    tokenMint: hydMint.publicKey,
                    redeemableMint: xhydMint.publicKey,
                    userTo: hydTokenAccount.publicKey,
                    tokenVault: vaultPubkey,
                    redeemableFrom: xHydAccount,
                    redeemableFromAuthority: program.provider.wallet.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                }
            }
        )
        assert.strictEqual(await getTokenBalance(program.provider, xHydAccount), 0)
        assert.strictEqual(await getTokenBalance(program.provider, vaultPubkey), 0)
        assert.strictEqual(await getTokenBalance(program.provider, hydTokenAccount.publicKey), 100000000)
    });
});
