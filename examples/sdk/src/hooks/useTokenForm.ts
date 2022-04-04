import { useToken } from "./useToken";
import { useCallback, useMemo, useState } from "react";
import localnetTokens from "config-ts/tokens/localnet.json";
import { HydraSDK } from "hydra-ts";

const assets = localnetTokens.tokens;
export function useTokenForm(client: HydraSDK) {
  // console.log("useTokenForm");

  const tokenFrom = useToken();
  const tokenTo = useToken();
  const [focus, setFocus] = useState<"from" | "to">("from");
  const assetsTokenFrom = useMemo(
    () => assets.filter(({ symbol }) => symbol !== tokenTo.asset?.symbol),
    [tokenTo]
  );
  const assetsTokenTo = useMemo(
    () => assets.filter(({ symbol }) => symbol !== tokenFrom.asset?.symbol),
    [tokenFrom]
  );

  // toggle fields
  const toggleFields = useCallback(() => {
    const bottomAmount = tokenTo.amount;
    const bottomAsset = tokenTo.asset;
    const topAsset = tokenFrom.asset;

    topAsset && tokenTo.setInternalAsset(topAsset);
    bottomAsset && tokenFrom.setInternalAsset(bottomAsset);
    tokenFrom.setAmount(bottomAmount);
  }, [tokenTo, tokenFrom]);

  const tokenFromMint = tokenFrom.mint;
  const tokenToMint = tokenTo.mint;

  const [tokenXMint, tokenYMint] = useMemo(() => {
    if (!tokenFromMint || !tokenToMint) return [tokenFromMint, tokenToMint];
    return [tokenFromMint, tokenToMint].sort((a, b) =>
      a.toBuffer().compare(b.toBuffer())
    );
  }, [tokenFromMint, tokenToMint]);

  return {
    focus,
    setFocus,
    tokenFrom,
    tokenTo,
    assetsTokenFrom,
    assetsTokenTo,
    toggleFields,
    tokenXMint,
    tokenYMint,
  };
}
