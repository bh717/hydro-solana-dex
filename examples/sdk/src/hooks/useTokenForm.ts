import { useToken } from "./useToken";
import { useCallback, useMemo } from "react";
import localnetTokens from "config-ts/tokens/localnet.json";
import { HydraSDK } from "hydra-ts";

const assets = localnetTokens.tokens;
export function useTokenForm(client: HydraSDK) {
  // console.log("useTokenForm");

  const tokenFrom = useToken();
  const tokenTo = useToken();
  // const [inverted, setInverted] = useState(false);
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
    // console.log("swappy:toggleFields");
    const bottomAmount = tokenTo.amount;
    const bottomAsset = tokenTo.asset;
    const topAsset = tokenFrom.asset;
    // console.log("swappy:toggleFields:tokenFrom.asset", tokenFrom.asset);
    // console.log("swappy:toggleFields:tokenFrom.amount", tokenFrom.amount);
    // console.log("swappy:toggleFields:tokenTo.asset", tokenTo.asset);
    // console.log("swappy:toggleFields:tokenTo.amount", tokenTo.amount);

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

  // console.log("swappy:tokens", {
  //   tokenFrom: {
  //     asset: tokenFrom.asset?.symbol,
  //     amount: tokenFrom.amount,
  //   },
  //   tokenTo: { asset: tokenTo.asset?.symbol, amount: tokenTo.amount },
  //   tokenXMint: `${tokenXMint}`,
  //   tokenYMint: `${tokenYMint}`,
  // });

  return {
    tokenFrom,
    tokenTo,
    assetsTokenFrom,
    assetsTokenTo,
    toggleFields,
    tokenXMint,
    tokenYMint,
  };
}
