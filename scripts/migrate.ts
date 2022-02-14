import { resolve } from "path";
import * as anchor from "@project-serum/anchor";
import arg from "arg";
import expandTilde from "expand-tilde";
import fs from "fs";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import toml from "toml";

type MigrationFn = (p: anchor.Provider) => Promise<void>;

const args = arg({
  "--features": String,
});

// messy script to run our deploy scripts in
// light of anchor migrate not working
// we will have to customise this for
async function main() {
  // Not sure if these should be configurable but they will
  // allow us to switch between deployment networks
  const urlMap = {
    localnet: "http://localhost:8899",
  };

  const feature = args["--features"] || "localnet";

  if (!Object.keys(urlMap).includes(feature)) {
    console.log("Invalid feature");
    process.exit(1);
  }

  // Get the url from the feature
  const url = urlMap[feature];

  // set anchor wallet on env
  const config = toml.parse(
    fs.readFileSync(resolve(__dirname, "../Anchor.toml")).toString()
  );
  process.env.ANCHOR_WALLET = expandTilde(config.provider.wallet);

  // load user script
  const script = resolve(__dirname, "../migrations/deploy.ts");
  const userScript = (await import(script)).default as MigrationFn;

  // Setup provider
  const preflightCommitment = "recent";
  const connection = new anchor.web3.Connection(url, preflightCommitment);
  const wallet = NodeWallet.local();
  const provider = new anchor.Provider(connection, wallet, {
    preflightCommitment,
    commitment: "recent",
  });

  // Run userScript with provider
  await userScript(provider);
  console.log("Finished running script");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
