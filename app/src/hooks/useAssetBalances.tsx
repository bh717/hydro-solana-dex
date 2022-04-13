import { useObservable } from "./useObservable";
import { useBalances } from "./useBalances";
import { useCombineAssetBalances } from "./useCombineAssetBalances";
import tokens from "config-ts/tokens/localnet.json";

export const assets = tokens.tokens;

export function useAssetBalances() {
  const balances$ = useBalances(assets);
  const balances = useObservable(balances$);

  const combined = useCombineAssetBalances(assets, balances);
  return combined;
}
