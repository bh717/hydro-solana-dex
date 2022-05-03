import { useObservable } from "./useObservable";
import { useBalances } from "./useBalances";
import { useCombineAssetBalances } from "./useCombineAssetBalances";
import { getTokenList } from "hydra-ts";
import { useNetworkProvider } from "hydra-react-ts";

export function useAssetBalances() {
  const { network } = useNetworkProvider();
  const assets = getTokenList(network);
  const balances$ = useBalances(assets);
  const balances = useObservable(balances$);

  const combined = useCombineAssetBalances(assets, balances);
  return combined;
}
