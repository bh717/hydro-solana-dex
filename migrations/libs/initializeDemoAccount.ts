import { HydraSDK } from "hydra-ts";
import { PublicKey } from "@solana/web3.js";
import { loadKey } from "hydra-ts/node";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { InitializeTraderConfig, getMintKeyFromSymbol } from "./libs";

export async function initializeDemoAccount(
  sdk: HydraSDK,
  config: InitializeTraderConfig,
  srcAccounts: Map<string, PublicKey>
) {
  // Load up a demoAccount account
  const demoAccount = await loadKey(`keys/users/${config.demoAccountKey}.json`);
  console.log(`Using demoAccount: ${demoAccount.publicKey}`);
  const { connection } = sdk.ctx;

  console.log(`Requesting airdrop for demoAccount...`);
  await connection.confirmTransaction(
    await connection.requestAirdrop(demoAccount.publicKey, 10 * 1_000_000),
    "confirmed"
  );
  console.log(`Finished requesting airdrop`);

  const payer = (sdk.ctx.provider.wallet as any as NodeWallet).payer;
  if (!payer) throw new Error("Payer was not defined");
  for (const { symbol, amount } of config.tokens) {
    const mintKey = getMintKeyFromSymbol(symbol, sdk.ctx.network);
    const srcKey = srcAccounts.get(symbol);
    if (!srcKey) throw new Error("srcKey not found for symbol: " + symbol);

    console.log(`Creating associated account for mint: "${mintKey}"`);
    const demoAccountAta = await sdk.common.createAssociatedAccount(
      mintKey,
      demoAccount,
      payer
    );
    console.log(`Transferring amount: "${amount}"`);
    await sdk.common.transfer(srcKey, demoAccountAta, amount);
    console.log(`Done`);
  }
}
