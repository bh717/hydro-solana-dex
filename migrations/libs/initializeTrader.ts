import { HydraSDK } from "hydra-ts";
import { PublicKey } from "@solana/web3.js";
import { loadKey } from "hydra-ts/node";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { InitializeTraderConfig, getMintKeyFromSymbol } from "./libs";

export async function initializeTrader(
  sdk: HydraSDK,
  config: InitializeTraderConfig,
  srcAccounts: Map<string, PublicKey>
) {
  // Load up a trader account
  const trader = await loadKey(`keys/users/${config.traderKey}.json`);

  const { connection } = sdk.ctx;

  console.log(`Requesting airdrop for trader...`);
  await connection.confirmTransaction(
    await connection.requestAirdrop(trader.publicKey, 10 * 1_000_000),
    "confirmed"
  );
  console.log(`Finished requesting airdrop`);

  const payer = (sdk.ctx.provider.wallet as any as NodeWallet).payer;
  if (!payer) throw new Error("Payer was not defined");
  for (const { symbol, amount } of config.tokens) {
    const mintKey = getMintKeyFromSymbol(symbol, sdk.ctx.network);
    const srcKey = srcAccounts.get(symbol);
    if (!srcKey) throw new Error("srcKey not found for symbol: " + symbol);
    const traderAta = await sdk.common.createAssociatedAccount(
      mintKey,
      trader,
      payer
    );
    await sdk.common.transfer(srcKey, traderAta, amount);
  }
}
