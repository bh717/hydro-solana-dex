import * as anchor from '@project-serum/anchor';
import {    Program } from '@project-serum/anchor';
import { HydraStaking } from '../../target/types/hydra_staking';
import {loadKey, createMintAndVault, createMint} from "../utils/utils"
import { TokenInstructions } from "@project-serum/serum"
import {Keypair} from "@solana/web3.js";
import {createTokenAccount, getMintInfo} from "@project-serum/common";
import {TOKEN_PROGRAM_ID} from "@project-serum/serum/lib/token-instructions";

describe('hydra-staking',  () => {
    anchor.setProvider(anchor.Provider.env());
    const program = anchor.workspace.HydraStaking as Program<HydraStaking>;

    let hydMint
    let xhydMint

    let vaultPubkey
    let vaultBump

    let hydTokenAccount = Keypair.generate()
    let xHydAccount

    it('should mint Hyd', async () => {

        // load keyPair
        hydMint = await loadKey("tests/keys/hyd3VthE9YPGBeg9HEgZsrM5qPniC6VoaEFeTGkVsJR.json")
        await createMintAndVault(program.provider, hydMint, hydTokenAccount, new anchor.BN(100_000_000))

        //
        // console.log(hydMint.publicKey)
        // console.log(hydVault.publicKey)
        // console.log(program.provider.wallet.publicKey)
        //
        // console.log(await getMintInfo(program.provider, hydMint.publicKey))
    })

    it('should initialized stake PDA vault', async () => {
       [vaultPubkey, vaultBump] = await anchor.web3.PublicKey.findProgramAddress(
            [hydMint.publicKey.toBuffer()],
            program.programId
        )

        await program.rpc.initialize(
            vaultBump,
            {
                accounts: {
                    tokenMint: hydMint.publicKey,
                    tokenVault: vaultPubkey,
                    initializer: program.provider.wallet.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                }
            });
    });

    it('should create xhyd mint', async () => {
        xhydMint = await loadKey("tests/keys/xhy1rv75cEJahTbsKnv2TpNhdR7KNUoDPavKuQDwhDU.json")
        await createMint(program.provider, xhydMint, vaultPubkey)

        // console.log(vaultPubkey)
        // console.log(await getMintInfo(program.provider,xhysMint.publicKey))

        xHydAccount = await createTokenAccount(program.provider, xhydMint.publicKey, program.provider.wallet.publicKey)
    });

    it('should stake tokens into vault', async () => {

        program.addEventListener('StakeEvent', (e, s) => {
           console.log(e)
        });

        program.addEventListener('StakeDetails', (e,s) => {
            console.log(e)
            }
        )

        console.log("hydTokenAccount: ", await program.provider.connection.getTokenAccountBalance(hydTokenAccount.publicKey))
        console.log("xHydAccount: ", await program.provider.connection.getTokenAccountBalance(xHydAccount))

        console.log("programId: ", program.programId.toString())
        console.log("hydMint.publicKey: ", hydMint.publicKey.toString())
        console.log("xhydMint.publicKey: ", xhydMint.publicKey.toString())
        console.log("hydTokenAccount.publicKey: ",hydTokenAccount.publicKey.toString())
        console.log("provider.wallet.publicKey: ", program.provider.wallet.publicKey.toString())
        console.log("vaultPubkey: ",vaultPubkey.toString())


        await program.rpc.stake(
            vaultBump,
            new anchor.BN(1000),
            {
                accounts: {
                    tokenMint: hydMint.publicKey,
                    xTokenMint: xhydMint.publicKey,
                    tokenFrom: hydTokenAccount.publicKey,
                    tokenFromAuthority: program.provider.wallet.publicKey,
                    tokenVault: vaultPubkey,
                    xTokenTo: xHydAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                }
            }
        )

        console.log("hydTokenAccount: ", await program.provider.connection.getTokenAccountBalance(hydTokenAccount.publicKey))
        console.log("xHydAccount: ", await program.provider.connection.getTokenAccountBalance(xHydAccount))
    });
});
