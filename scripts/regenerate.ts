import { Asset, Network } from "hydra-ts";

import { Keypair } from "@solana/web3.js";
import { getAssets, getTokenStore, NetworkedTokenMap } from "hydra-ts";
import { saveKey } from "hydra-ts/node";
import fs from "fs";
import arg from "arg";
// import { NetworkLookupType } from "hydra-react-ts";

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

async function writeTrader(network: Network, keypair: Keypair) {
  await saveKey(keypair, "users");

  fs.writeFileSync(
    `migrations/${network}.trader.json`,
    JSON.stringify({ account: keypair.publicKey }, null, 2) + "\n"
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

  // regenerate trader key
  const demoAccountKeys = Keypair.generate();

  await writeTrader(network, demoAccountKeys);

  await tidyUpTokens();
}

async function tidyUpTokens() {
  const map = JSON.parse(
    fs.readFileSync("sdks/config-ts/tokens.json").toString()
  ) as NetworkedTokenMap;

  const allowedTokenAddresses: string[] = [];
  for (const net of Object.values(Network)) {
    const tokens = map[net] ?? [];
    for (const token of tokens) {
      allowedTokenAddresses.push(token.address);
    }
  }

  const keysToRemove = fs
    .readdirSync("keys/tokens")
    .map((tokenJson) => tokenJson.replace(/\.json$/, ""))
    .filter((key) => !allowedTokenAddresses.includes(key));

  for (const key of keysToRemove) {
    fs.unlinkSync(`keys/tokens/${key}.json`);
  }

  // Load
  const { account: devnetaccount } = JSON.parse(
    fs.readFileSync("migrations/devnet.trader.json").toString()
  ) as { account: string };

  const { account: localaccount } = JSON.parse(
    fs.readFileSync("migrations/localnet.trader.json").toString()
  ) as { account: string };

  const usersToRemove = fs
    .readdirSync("keys/users")
    .map((tokenJson) => tokenJson.replace(/\.json$/, ""))
    .filter((key) => ![devnetaccount, localaccount].includes(key));

  for (const key of usersToRemove) {
    fs.unlinkSync(`keys/users/${key}.json`);
  }
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
