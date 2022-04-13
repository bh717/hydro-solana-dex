export type PromiseVal<T> = T extends Promise<infer J> ? J : never;

// From token-list
export type Asset = {
  balance?: bigint;
  chainId: number;
  address: string;
  name: string;
  decimals: number;
  symbol: string;
  logoURI: string;
};

export type AssetBalance = {
  [key: string]: number;
};
