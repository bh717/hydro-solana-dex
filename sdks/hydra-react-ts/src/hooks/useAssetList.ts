import tokens from "config-ts/tokens/localnet.json";
export function useAssetList(/* network: "localnet" | "devnet" | "mainnet" */) {
  return tokens.tokens;
}
