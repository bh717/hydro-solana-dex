import * as Buffer from "buffer";
import { URL } from "url";
import * as fs from "fs";
import * as anchor from '@project-serum/anchor';

type PathLike = string | Buffer | URL;

export async function loadKey(path: PathLike) :Promise<anchor.web3.Keypair> {
    let rawdata = fs.readFileSync(path)
    let keydata = JSON.parse(rawdata.toString())
    return anchor.web3.Keypair.fromSecretKey(new Uint8Array(keydata))
}

