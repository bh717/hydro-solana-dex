import { InitializeConfig } from "./libs";
import * as anchor from "@project-serum/anchor";
import { HydraSDK, Network } from "hydra-ts";
import { quitOnError } from "./quitOnError";
import { initializeTokens } from "./initializeTokens";
import { initializePools } from "./initializePools";
import { initializeTrader } from "./initializeTrader";

export async function initialize(
  provider: anchor.Provider,
  network: Network,
  config: InitializeConfig
) {
  anchor.setProvider(provider);

  // Hydra SDK has the god wallet in it's provider
  const sdk = HydraSDK.createFromAnchorProvider(provider, network);
  // Get the config
  // Amounts and wallets are different based on network

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
}
