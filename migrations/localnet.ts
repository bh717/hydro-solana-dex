// This is not run with anchor migrate
import * as anchor from "@project-serum/anchor";
import { Network } from "hydra-ts";
import { initialize } from "./libs/initialize";
import { account } from "./localnet.demo.json";

export default async function (provider: anchor.Provider) {
  const fees = {
    swapFeeNumerator: 1n,
    swapFeeDenominator: 500n,
    ownerTradeFeeNumerator: 0n,
    ownerTradeFeeDenominator: 0n,
    ownerWithdrawFeeNumerator: 0n,
    ownerWithdrawFeeDenominator: 0n,
    hostFeeNumerator: 0n,
    hostFeeDenominator: 0n,
  };

  await initialize(provider, Network.LOCALNET, {
    tokens: [
      { symbol: "usdc", amount: 100000000000000n },
      { symbol: "wbtc", amount: 100000000n * 100000000n },
      { symbol: "weth", amount: 100000000000000000n },
      {
        symbol: "wsol",
        amount: 100000000n * 1000000000n,
      },
    ],
    pools: [
      {
        tokenX: "wbtc",
        tokenY: "usdc",
        tokenXAmount: 1000n * 10n ** 8n,
        tokenYAmount: 45166800n * 10n ** 6n,
        fees,
      },
      {
        tokenX: "weth",
        tokenY: "usdc",
        tokenXAmount: 1000n * 10n ** 9n,
        tokenYAmount: 3281000n * 10n ** 6n,
        fees,
      },
    ],
    demoAccount: {
      tokens: [
        { symbol: "usdc", amount: 100n * 1000000n },
        { symbol: "wbtc", amount: 100n * 1000000n },
        { symbol: "weth", amount: 100n * 1000000n },
        { symbol: "wsol", amount: 100n * 1000000n },
      ],
      demoAccountKey: account,
    },
  });
}
