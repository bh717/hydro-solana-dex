import * as anchor from '@project-serum/anchor';
import {TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount, mintTo} from "@solana/spl-token";
import {BN, Program, web3} from '@project-serum/anchor';
import { HydraStaking } from '../../target/types/hydra_staking';
import { loadKey } from "../utils/utils"

describe('hydra-staking',  () => {
    anchor.setProvider(anchor.Provider.env());
    const program = anchor.workspace.HydraStaking as Program<HydraStaking>;

    let hydMintKeyPair

    let vaultPubkey
    let vaultBump

    it('should mint Hyd', async () => {
        // Create signer account
        let signer = anchor.web3.Keypair.generate()

        // airdrop sol to signer account
        await program.provider.connection.confirmTransaction(
            await program.provider.connection.requestAirdrop(signer.publicKey, 10000000000),
            "confirmed"
        )

        // load keyPair
        hydMintKeyPair = await loadKey("tests/keys/hyd3VthE9YPGBeg9HEgZsrM5qPniC6VoaEFeTGkVsJR.json")

        // create mint with keyPair
        await createMint(
            program.provider.connection,
            signer,
            signer.publicKey,
            signer.publicKey,
            9,
            hydMintKeyPair,
        )

        // create AssociatedTokenAccount for signer
        let assTokenAccount = await getOrCreateAssociatedTokenAccount(
            program.provider.connection,
            signer,
            hydMintKeyPair.publicKey,
            signer.publicKey
        )

        // mint to signer AssociatedTokenAccount
        await mintTo(
            program.provider.connection,
            signer,
            hydMintKeyPair.publicKey,
            assTokenAccount.address,
            signer,
            100000000,
        )
    })

    it('should initialized stake PDA vault', async () => {
       [vaultPubkey, vaultBump] = await anchor.web3.PublicKey.findProgramAddress(
            [hydMintKeyPair.publicKey.toBuffer()],
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
                tokenProgram: TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            }
            });
    });

    // it('should create xhyd mint', async () => {
    //     xhydMint = await loadKey("tests/keys/xhy1rv75cEJahTbsKnv2TpNhdR7KNUoDPavKuQDwhDU.json")
    //     // let mintPubkey = await createMint(program.provider, xhydMint)
    //     // console.log("xdyMint: ", xhydMint)
    //     // console.log(await getMintInfo(program.provider,xhydMint))
    // });
    //
    // it('should stake tokens into vault', async () => {
    //
    //     await program.rpc.stake(
    //         vaultBump,
    //         new anchor.BN(100),
    //         {
    //           accounts: {
    //               tokenMint: hydMint.publicKey,
    //               xTokenMint: xhydMint.publicKey,
    //               tokenFrom: hydWalletAccount,
    //               tokenFromAuthority: program.provider.wallet.publicKey,
    //               tokenVault: vaultPubkey,
    //               xTokenTo: anchor.web3.Keypair.generate(),
    //               tokenProgram: TOKEN_PROGRAM_ID,
    //           }
    //         })
    //   });
});
