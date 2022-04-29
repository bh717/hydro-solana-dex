import { Asset, Network } from "hydra-ts";

import { Keypair } from "@solana/web3.js";
import { getAssets, getTokenStore } from "hydra-ts";
import { saveKey } from "hydra-ts/node";
import fs from "fs";
import arg from "arg";

const args = arg({
  "--network": String,
});

function writeTokens(network: Network, newTokens: Asset[]) {
  const tokenStore = getTokenStore();
  const newTokenStore = {
    ...tokenStore,
    [network]: newTokens,
  };
  fs.writeFileSync(
    "sdks/config-ts/tokens.json",
    JSON.stringify(newTokenStore, null, 2) + "\n"
  );
}

async function regenerate(network: Network) {
  // Regenerate the keys within the list targeting specific clusters writing their keys to the repo
  // pull list of tokens from config-ts/tokens.json[network]
  const curTokens = getAssets(network);

  const newTokens: Asset[] = [];

  for (const token of curTokens) {
    // for each token generate a new keypair
    const keypair = Keypair.generate();

    const newToken = {
      ...token,
      address: keypair.publicKey.toString(),
    };

    newTokens.push(newToken);

    // write each keypairs private key to /keys/tokens/xxx.json don't delete the old ones they might be used elsewhere
    await saveKey(keypair);
  }

  // update the list of tokens with the new publickeys config-ts/tokens.json[network]
  writeTokens(network, newTokens);
}

function isNetwork(value: any): value is Network {
  return Object.values(Network).includes(value);
}

async function main() {
  const network = args["--network"] as Network;
  if (!isNetwork(network)) {
    console.log(
      `--network must be one of the following: ${Object.values(Network)}`
    );
    process.exit(1);
  }
  await regenerate(network);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
