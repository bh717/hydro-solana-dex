import { Provider } from "@project-serum/anchor";
import { AccountInfo, PublicKey, SystemProgram } from "@solana/web3.js";
import * as TokenInstructions from "@project-serum/serum/lib/token-instructions";
import { TransactionInstruction } from "@solana/web3.js";
import { SPLAccountInfo } from "../..";
import { AccountLayout, u64 } from "@solana/spl-token";

export async function createMintInstructions(
  provider: Provider,
  authority: PublicKey,
  mint: PublicKey,
  decimals?: number
): Promise<TransactionInstruction[]> {
  let instructions = [
    SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey: mint,
      space: 82,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(82),
      programId: TokenInstructions.TOKEN_PROGRAM_ID,
    }),
    TokenInstructions.initializeMint({
      mint,
      decimals: decimals ?? 0,
      mintAuthority: authority,
    }),
  ];
  return instructions;
}

export async function createTokenAccountInstrs(
  provider: Provider,
  newAccountPubkey: PublicKey,
  mint: PublicKey,
  owner: PublicKey,
  lamports?: number
): Promise<TransactionInstruction[]> {
  if (lamports === undefined) {
    lamports = await provider.connection.getMinimumBalanceForRentExemption(165);
  }
  return [
    SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey,
      space: 165,
      lamports,
      programId: TokenInstructions.TOKEN_PROGRAM_ID,
    }),
    TokenInstructions.initializeAccount({
      account: newAccountPubkey,
      mint,
      owner,
    }),
  ];
}

export function decodeAccountInfo(info: AccountInfo<Buffer>) {
  return AccountLayout.decode(info.data);
}

export function decodeTokenAccountInfo(
  address: PublicKey,
  info: AccountInfo<Buffer>
): SPLAccountInfo {
  const accountInfo = AccountLayout.decode(info.data);
  // OK so this is shamozzle within SPLToken program
  // we need to decode and parse stuff from the returned buffer
  // here returning a limited number of props as we need them this can grow
  // console.log(accountInfo);
  // console log them and work out how to parse them. This is a good reference (note version number):
  // SPL Token 2 hopefully is better
  // https://github.com/solana-labs/solana-program-library/blob/%40solana/spl-token%40v0.1.8/token/js/client/token.js
  return {
    address,
    owner: new PublicKey(accountInfo.owner),
    mint: new PublicKey(accountInfo.mint),
    amount: BigInt(
      u64.fromBuffer(accountInfo.amount as any as Buffer).toString()
    ),
  };
}