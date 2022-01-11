import * as Buffer from "buffer";
import { URL } from "url";
import * as fs from "fs";
import * as anchor from '@project-serum/anchor';
import {BN, Provider} from "@project-serum/anchor";
import { PublicKey, Account, Transaction, SystemProgram } from "@solana/web3.js";
import { TokenInstructions } from '@project-serum/serum';

type PathLike = string | Buffer | URL;

export async function loadKey(path: PathLike) :Promise<anchor.web3.Keypair> {
    let rawdata = fs.readFileSync(path)
    let keydata = JSON.parse(rawdata.toString())
    return anchor.web3.Keypair.fromSecretKey(new Uint8Array(keydata))
}

export async function createMintAndVault(
    provider: Provider,
    mint: Account,
    vault: Account,
    amount: BN,
    owner?: PublicKey,
    decimals?: number,
): Promise<[PublicKey, PublicKey]> {
    if (owner === undefined) {
        owner = provider.wallet.publicKey;
    }
    const tx = new Transaction();
    tx.add(
        SystemProgram.createAccount({
            fromPubkey: provider.wallet.publicKey,
            newAccountPubkey: mint.publicKey,
            space: 82,
            lamports: await provider.connection.getMinimumBalanceForRentExemption(82),
            programId: TokenInstructions.TOKEN_PROGRAM_ID,
        }),
        TokenInstructions.initializeMint({
            mint: mint.publicKey,
            decimals: decimals ?? 0,
            mintAuthority: provider.wallet.publicKey,
        }),
        SystemProgram.createAccount({
            fromPubkey: provider.wallet.publicKey,
            newAccountPubkey: vault.publicKey,
            space: 165,
            lamports: await provider.connection.getMinimumBalanceForRentExemption(
                165,
            ),
            programId: TokenInstructions.TOKEN_PROGRAM_ID,
        }),
        TokenInstructions.initializeAccount({
            account: vault.publicKey,
            mint: mint.publicKey,
            owner,
        }),
        TokenInstructions.mintTo({
            mint: mint.publicKey,
            destination: vault.publicKey,
            amount,
            mintAuthority: provider.wallet.publicKey,
        }),
    );
    await provider.send(tx, [mint, vault]);
    return [mint.publicKey, vault.publicKey];
}
