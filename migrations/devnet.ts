// This is not run with anchor migrate
import * as anchor from "@project-serum/anchor";
import { HydraSDK, Network } from "hydra-ts";
import { quitOnError } from "./libs/quitOnError";
import { initializePools } from "./libs/initializePools";
import { initializeTrader } from "./libs/initializeTrader";
import { initializeTokens } from "./libs/initializeTokens";
import { initializeConfig } from "./libs/initializeConfig";

export default async function (provider: anchor.Provider) {
  anchor.setProvider(provider);

  // Hydra SDK has the god wallet in it's provider
  const sdk = HydraSDK.createFromAnchorProvider(provider, Network.DEVNET);
  // Get the config
  // Amounts and wallets are different based on network
  const config = initializeConfig(sdk.ctx.network);

  // Mint/initialize new independent test tokens for specific amounts to given cluster based on a given list to the god address
  const srcAccounts = await quitOnError(
    () => initializeTokens(sdk, config.tokens),
    "You may need to run regenerate"
  );

  // Initialize independent pools per cluster with specific balances
  await quitOnError(() => initializePools(sdk, config.pools));

  // Initialize a trader account with specific amounts of spendable tokens
  await quitOnError(() => initializeTrader(sdk, config.trader, srcAccounts));

  // Ok so now if you load up the private keys for both god and the
  // trader in your test wallet, you should be able to play around with the app on localhost:

  // yarn private-key ./keys/users/usrQpqgkvUjPgAVnGm8Dk3HmX3qXr1w4gLJMazLNyiW.json
  // yarn private-key ~/.config/solana/id.json
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
