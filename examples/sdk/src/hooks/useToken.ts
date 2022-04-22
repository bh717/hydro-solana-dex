import { PublicKey } from "@solana/web3.js";
import { useCallback, useMemo, useState } from "react";
import { Asset } from "../types";

export type TokenField = ReturnType<typeof useToken>;

export function useToken(initAsset?: Asset) {
  const [amount, setAmount] = useState(0n);
  const [asset, setInternalAsset] = useState<Asset | undefined>(initAsset);

  const toNewAssetAmount = useCallback(
    (newAsset: Asset) => {
      // adjust value so it stays the same when asset changes
      const oldDecimals = asset?.decimals ?? 6;
      const newDecimals = newAsset.decimals;
      return BigInt(Number(amount) * 10 ** (newDecimals - oldDecimals));
    },
    [asset, amount]
  );

  const setAsset = useCallback(
    (newAsset: Asset) => {
      setAmount(toNewAssetAmount(newAsset));
      setInternalAsset(newAsset);
    },
    [setAmount, toNewAssetAmount]
  );

  const mint = useMemo(() => {
    if (!asset) return;
    return new PublicKey(asset.address);
  }, [asset]);

  return {
    amount,
    setAmount,
    asset,
    setAsset,
    setInternalAsset,
    mint,
    toNewAssetAmount,
  };
}
