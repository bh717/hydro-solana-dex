import { Network } from "hydra-ts";
import TM from "config-ts/tokens.json";
export type Token = {
  chainId: number;
  address: string;
  name: string;
  decimals: number;
  symbol: string;
  logoURI: string;
};

type NetworkedTokenMap = {
  [n in Network]: Token[];
};

export const TokensStore = TM as NetworkedTokenMap;

export function getAssets(network: Network) {
  return TokensStore[network];
}
export function getAsset(symbol: string, network: Network) {
  return TokensStore[network].find(
    (asset: Token) => asset.symbol.toLowerCase() === symbol.toLowerCase()
  );
}

export function getTokenStore() {
  return TM as NetworkedTokenMap;
}
