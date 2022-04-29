import { HydraSDK } from "hydra-ts";
import { PublicKey } from "@solana/web3.js";
import { loadKey } from "hydra-ts/node";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { InitializeTraderConfig, getMintKeyFromSymbol } from "./initialize";

export async function initializeTrader(
  sdk: HydraSDK,
  config: InitializeTraderConfig,
  srcAccounts: Map<string, PublicKey>
) {
  // Load up a trader account
  const trader = await loadKey(`keys/users/${config.traderKey}.json`);

  const { connection } = sdk.ctx;
  await connection.confirmTransaction(
    await connection.requestAirdrop(trader.publicKey, 10000000000),
    "confirmed"
  );

  const payer = (sdk.ctx.provider.wallet as any as NodeWallet).payer;
  if (!payer) throw new Error("Payer was not defined");
  for (const { symbol, amount } of config.tokens) {
    const mintKey = getMintKeyFromSymbol(symbol, sdk.ctx.network);
    const srcKey = srcAccounts.get(symbol);
    const traderAta = await sdk.common.createAssociatedAccount(
      mintKey,
      trader,
      payer
    );
    await sdk.common.transfer(srcKey, traderAta, amount);
  }
}
