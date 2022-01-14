import * as anchor from '@project-serum/anchor';
import {BN, Program, web3} from '@project-serum/anchor';
import { HydraStaking } from '../../target/types/hydra_staking';
import { loadKey } from "../utils/utils"
import * as serumCommon from "@project-serum/common"
import { TokenInstructions } from "@project-serum/serum"

describe('hydra-staking',  () => {
    anchor.setProvider(anchor.Provider.env());
    const program = anchor.workspace.HydraStaking as Program<HydraStaking>;

    let signer = anchor.web3.Keypair.generate()

    let hydMintKeyPair
    let hydMint

    let xhysMintKeyPair
    let xhysMint

    let vaultPubkey
    let vaultBump

    let assTokenAccount
    let xAssTokenAccount

    it('should mint Hyd', async () => {
        // airdrop sol to signer account
        await program.provider.connection.confirmTransaction(
            await program.provider.connection.requestAirdrop(signer.publicKey, 10000000000),
            "confirmed"
        )

        // load keyPair
        hydMintKeyPair = await loadKey("tests/keys/hyd3VthE9YPGBeg9HEgZsrM5qPniC6VoaEFeTGkVsJR.json")

        // // create mint with keyPair
        // await createMint(
        //     program.provider.connection,
        //     signer,
        //     program.provider.wallet.publicKey,
        //     null,
        //     9,
        //     hydMintKeyPair,
        // )
        //
        // // create AssociatedTokenAccount for signer
        // assTokenAccount = await getOrCreateAssociatedTokenAccount(
        //     program.provider.connection,
        //     signer,
        //     hydMintKeyPair.publicKey,
        //     program.provider.wallet.publicKey,
        // )
        //
        // let x = program.provider.wallet
        //
        // // mint to signer AssociatedTokenAccount
        // await mintTo(
        //     program.provider.connection,
        //     signer,
        //     hydMintKeyPair.publicKey,
        //     assTokenAccount.address,
        //     program.provider.wallet,
        //     100000000,
        // )

        let [mint, vault] = await serumCommon.createMintAndVault(program.provider, new anchor.BN(100_000_000),program.provider.wallet.publicKey,9)

    })

    it('should initialized stake PDA vault', async () => {
       [vaultPubkey, vaultBump] = await anchor.web3.PublicKey.findProgramAddress(
            [mint.publicKey.toBuffer()],
            program.programId
        )

        await program.rpc.initialize(
            vaultBump,
            {
                accounts: {
                    tokenMint: hydMintKeyPair.publicKey,
                    tokenVault: vaultPubkey,
                    initializer: program.provider.wallet.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                }
            });
    });

    // it('should create xhyd mint', async () => {
    //     xhysMintKeyPair = await loadKey("tests/keys/xhy1rv75cEJahTbsKnv2TpNhdR7KNUoDPavKuQDwhDU.json")
    //
    //     await createMint(
    //         program.provider.connection,
    //         signer,
    //         signer.publicKey,
    //         null,
    //         9,
    //         xhysMintKeyPair,
    //     )
    //
    //     // create xAssociatedTokenAccount for signer
    //     xAssTokenAccount = await getOrCreateAssociatedTokenAccount(
    //         program.provider.connection,
    //         signer,
    //         xhysMintKeyPair.publicKey,
    //         signer.publicKey
    //     )
    //
    // });

    // it('should stake tokens into vault', async () => {
    //
    //     program.addEventListener('StakeEvent', (e, s) => {
    //        console.log(e)
    //     });
    //
    //     console.log(await program.provider.connection.getTokenAccountBalance(assTokenAccount.address))
    //     console.log(await program.provider.connection.getTokenAccountBalance(xAssTokenAccount.address))
    //
    //     await program.rpc.stake(
    //         vaultBump,
    //         new anchor.BN(1000),
    //         {
    //             accounts: {
    //                 tokenMint: hydMintKeyPair.publicKey,
    //                 xTokenMint: xhysMintKeyPair.publicKey,
    //                 tokenFrom: assTokenAccount.address,
    //                 tokenFromAuthority: program.provider.wallet.publicKey,
    //                 tokenVault: vaultPubkey,
    //                 xTokenTo: xAssTokenAccount.address,
    //                 tokenProgram: TOKEN_PROGRAM_ID,
    //             }
    //         }
    //     )
    //
    //     console.log(await program.provider.connection.getTokenAccountBalance(assTokenAccount.address))
    //     console.log(await program.provider.connection.getTokenAccountBalance(xAssTokenAccount.address))
    // });
});
