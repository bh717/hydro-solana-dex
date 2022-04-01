import { MintLayout } from "@solana/spl-token";
import { AccountInfo, PublicKey } from "@solana/web3.js";

export function Parser(info: AccountInfo<Buffer>): TokenMint {
  console.log("TokenMintParser", info);
  return MintLayout.decode(info.data);
}

export type TokenMint = {
  mintAuthorityOption: 1 | 0;
  mintAuthority: PublicKey;
  supply: bigint;
  decimals: number;
  isInitialized: boolean;
  freezeAuthorityOption: 1 | 0;
  freezeAuthority: PublicKey;
};
