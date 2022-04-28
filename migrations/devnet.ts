// This is not run with anchor migrate
import * as anchor from "@project-serum/anchor";
import { Network } from "hydra-ts";
import { loadTokens, setupLiquidityPoolState, setupStakingState } from "./libs";

export default async function (provider: anchor.Provider) {
  const network = Network.DEVNET;
  anchor.setProvider(provider);
  const tokens = await loadTokens(network);

  // NOTE: currently these are setup the same for each network
  //       but the might need to diverge
  //       especially once we setup the faucets
  await setupStakingState(provider, network, tokens);
  await setupLiquidityPoolState(provider, network, tokens);
}
