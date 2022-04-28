import { getTokenList, Network } from "hydra-ts";

export function useAssetList(network: Network) {
  return getTokenList(network);
}
