// This is not run with anchor migrate
import * as anchor from "@project-serum/anchor";
import { HydraSDK, Network } from "hydra-ts";
import { setupPools } from "./libs/setup_pools";

export default async function (provider: anchor.Provider) {
  anchor.setProvider(provider);

  const sdk = HydraSDK.createFromAnchorProvider(provider, Network.LOCALNET);

  await setupPools(sdk);
  // const network = Network.LOCALNET;
  // anchor.setProvider(provider);
  // // Generate or load tokens to memory
  // // if --generate was passed in
  // const tokens = await Tokens.create(network, generate);
  // // tokens is a Map<T, Asset>()
  // // const tokens = await loadTokens(network);

  // // NOTE: currently these are setup the same for each network
  // //       but the might need to diverge
  // //       especially once we setup the faucets
  // await setupStakingState(provider, network, tokens);
  // await setupLiquidityPoolState(provider, network, tokens);
  // // If everything is successful save tokens to JSON.
  // await tokens.save();
}
