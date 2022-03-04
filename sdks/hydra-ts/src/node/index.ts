
/**
 * THE FOLLOWING IS BUILD WITH A NODE COMPILE TARGET
 */
 import { URL } from "url";
 import * as fs from "fs";
 import * as anchor from "@project-serum/anchor";
 
 type PathLike = string | Buffer | URL;
 
 export async function loadKey(path: PathLike): Promise<anchor.web3.Keypair> {
   let rawdata = fs.readFileSync(path);
   let keydata = JSON.parse(rawdata.toString());
   return anchor.web3.Keypair.fromSecretKey(new Uint8Array(keydata));
 }
 
 export async function saveKey(keypair: anchor.web3.Keypair): Promise<void> {
   const name = keypair.publicKey.toString();
   const path = `keys/localnet/staking/${name}.json`;
   const file  = JSON.stringify(Array.from(keypair.secretKey));
   fs.writeFileSync(path, Buffer.from(file));
 }