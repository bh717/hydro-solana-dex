import { useToken } from "./useToken";
import { useCallback, useMemo, useState } from "react";
import { useAssetList } from "./useAssetList";
import { Asset } from "../types";

export function useSlippage() {
  const [slippage, setSlippage] = useState(100n); // 1.0% / 10000 basis points
  return { slippage, setSlippage };
}

function findAsset(assets: Asset[], address?: string) {
  return address
    ? assets.find((asset) => address === asset.address)
    : undefined;
}

function excludeAsset(assets: Asset[], address?: string) {
  return assets.filter((asset) => asset.address !== address);
}

export function useTokenForm(props?: {
  tokenAInit?: string;
  tokenBInit?: string /*network*/;
}) {
  const { tokenAInit, tokenBInit } = props ?? {};
  const assets = useAssetList(/* network */);

  const tokenA = useToken(findAsset(assets, tokenAInit));
  const tokenB = useToken(findAsset(assets, tokenBInit));

  const [focus, setFocus] = useState<"from" | "to">("from");

  const assetsTokenA = useMemo(
    () => excludeAsset(assets, tokenB?.asset?.address),
    [tokenB, assets]
  );

  const assetsTokenB = useMemo(
    () => excludeAsset(assets, tokenA?.asset?.address),
    [tokenA, assets]
  );

  // toggle fields
  const toggleFields = useCallback(() => {
    const bottomAmount = tokenB.amount;
    const bottomAsset = tokenB.asset;
    const topAsset = tokenA.asset;

    topAsset && tokenB.setInternalAsset(topAsset);
    bottomAsset && tokenA.setInternalAsset(bottomAsset);
    tokenA.setAmount(bottomAmount);
  }, [tokenB, tokenA]);

  return {
    focus,
    setFocus,
    tokenA,
    tokenB,
    assetsTokenA,
    assetsTokenB,
    toggleFields,
  };
}
