import { NumericField } from "./NumericField";
import { TokenData } from "../hooks/useToken";
import { Asset } from "../types";
import { toFormat } from "../utils/toFormat";
import { fromFormat } from "../utils/fromFormat";
import { AssetSelector } from "./AssetSelector";

export function TokenField({
  token,
  assets,
}: {
  assets: Asset[];
  token: TokenData;
}) {
  return (
    <>
      <NumericField
        value={toFormat(token.amount, token.asset?.decimals)}
        onChange={(value) => {
          token.setAmount(fromFormat(value, token.asset?.decimals));
        }}
      />
      <AssetSelector
        selected={token.asset}
        assets={assets}
        onChange={token.setAsset}
      />
    </>
  );
}
