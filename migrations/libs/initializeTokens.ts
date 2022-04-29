import { HydraSDK } from "hydra-ts";
import { getAsset } from "./getAsset";
import { createMintAssociatedVaultFromAsset } from "./createMintAssociatedVaultFromAsset";
import { PublicKey } from "@solana/web3.js";
import { InitializeTokensConfig } from "./libs";

export async function initializeTokens(
  sdk: HydraSDK,
  config: InitializeTokensConfig
) {
  let isInitialized = false;
  for (const { symbol } of config) {
    const asset = getAsset(symbol, sdk.ctx.network);
    if (!asset) throw new Error("Asset not found" + symbol);
    // Will throw error is mint does not exist
    isInitialized &&= await sdk.accountLoaders
      .mint(new PublicKey(asset.address))
      .isInitialized();
  }
  if (isInitialized) {
    throw new Error("Tokens must not yet be initialized!");
  }
  const atas = new Map<string, PublicKey>();
  for (const { symbol, amount } of config) {
    const asset = getAsset(symbol, sdk.ctx.network);
    if (!asset) throw new Error("No Aset");
    atas.set(
      asset.symbol.toLowerCase(),
      await createMintAssociatedVaultFromAsset(sdk, asset, amount)
    );
  }
  return atas;
}
