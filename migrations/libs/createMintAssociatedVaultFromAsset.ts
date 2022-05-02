import { loadKey } from "hydra-ts/node";
import { Asset, HydraSDK } from "hydra-ts";

export async function createMintAssociatedVaultFromAsset(
  sdk: HydraSDK,
  asset: Asset | undefined,
  amount: bigint
) {
  if (!asset) throw new Error("Asset not provided!");
  console.log("Creating " + asset.name);
  const keypair = await loadKey(`keys/tokens/${asset.address}.json`);

  const [, ata] = await sdk.common.createMintAndAssociatedVault(
    keypair,
    amount,
    sdk.ctx.provider.wallet.publicKey,
    asset.decimals
  );
  console.log(`${asset.name}ATA: ${ata}\n`);
  return ata;
}
