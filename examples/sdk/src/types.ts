import { HydraSDK } from "hydra-ts";
import { TokenMint } from "hydra-ts/src/types/token-mint";
import { IAccountLoader } from "hydra-ts";

export type PromiseVal<T> = T extends Promise<infer J> ? J : never;
// From token-list
export type Asset = {
  chainId: number;
  address: string;
  name: string;
  decimals: number;
  symbol: string;
  logoURI: string;
};
export type LiquidityPoolAccounts = PromiseVal<
  ReturnType<HydraSDK["liquidityPools"]["accounts"]["getAccountLoaders"]>
> & {
  tokenXMint: IAccountLoader<TokenMint>;
  tokenYMint: IAccountLoader<TokenMint>;
};
