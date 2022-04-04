import { NumericField } from "./NumericField";
import { TokenField } from "../hooks/useToken";
import { Asset } from "../types";
import { toFormat } from "../utils/toFormat";
import { fromFormat } from "../utils/fromFormat";
import { AssetSelector } from "./AssetSelector";
import { useCallback } from "react";

export function TokenField({
  token,
  assets,
  focusLabel,
  onFocus,
}: {
  focusLabel: "from" | "to";
  onFocus: (focus: "from" | "to") => void;
  assets: Asset[];
  token: TokenField;
}) {
  const handleFocus = useCallback(() => {
    onFocus(focusLabel);
  }, [onFocus, focusLabel]);
  return (
    <>
      <NumericField
        value={toFormat(token.amount, token.asset?.decimals)}
        onChange={(value) => {
          token.setAmount(fromFormat(value, token.asset?.decimals));
        }}
        onFocus={handleFocus}
      />
      <AssetSelector
        selected={token.asset}
        assets={assets}
        onChange={token.setAsset}
      />
    </>
  );
}
