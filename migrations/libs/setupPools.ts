import { HydraSDK, Network } from "hydra-ts";
import { quitOnError, createMintAssociatedVaultFromAsset, getAsset } from ".";
import { PublicKey } from "@solana/web3.js";
import { PoolFees } from "hydra-ts/src/liquidity-pools/types";
import { loadKey } from "hydra-ts/node"; // these should be moved out of test
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";

type InitializeConfig = {
  tokens: InitializeTokensConfig;
  pools: InitializePoolConfig;
  trader: InitializeTraderConfig;
};

function initializeConfig(network: Network): InitializeConfig {
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
  return {
    tokens: [
      { symbol: "usdc", amount: 100_000_000_000000n }, // 100,000,000.000000
      { symbol: "wbtc", amount: 100_000_000n * 100_000_000n },
      { symbol: "weth", amount: 100_000_000_000000000n }, // 100,000,000.000000000
      {
        symbol: "wsol",
        amount: 100_000_000n * 1_000_000_000n,
      },
    ],
    pools: [
      {
        tokenX: "wbtc",
        tokenY: "usdc",
        tokenXAmount: 1_000n * 1_000_000_000n,
        tokenYAmount: 45_166_800n * 1_000_000n,
        fees,
      },
      {
        tokenX: "weth",
        tokenY: "usdc",
        tokenXAmount: 1_000n * 1_000_000_000n,
        tokenYAmount: 3_281_000n * 1_000_000n,
        fees,
      },
    ],
    trader: {
      tokens: [
        { symbol: "usdc", amount: 100n * 1_000_000n },
        { symbol: "wbtc", amount: 100n * 1_000_000n },
        { symbol: "weth", amount: 100n * 1_000_000n },
        { symbol: "sol", amount: 100n * 1_000_000n },
      ],
      traderKey: "usrQpqgkvUjPgAVnGm8Dk3HmX3qXr1w4gLJMazLNyiW",
    },
  };
}

type InitializeTokensConfig = Array<{ symbol: string; amount: bigint }>;

async function initializeTokens(sdk: HydraSDK, config: InitializeTokensConfig) {
  let isInitialized = false;
  for (const { symbol } of config) {
    const asset = getAsset(symbol, sdk.ctx.network);
    // Will throw error is mint does not exist
    isInitialized &&= await sdk.accountLoaders
      .mint(new PublicKey(asset.address))
      .isInitialized();
  }
  if (isInitialized) {
    throw new Error("Tokens must not yet be initialized!");
  }
  const atas = new Map<string, PublicKey>();

  for (const { symbol, amount } of config) {
    const asset = getAsset(symbol, sdk.ctx.network);
    atas.set(
      asset.symbol,
      await createMintAssociatedVaultFromAsset(sdk, asset, amount)
    );
  }
  return atas;
}
type PoolConfig = {
  tokenX: string;
  tokenY: string;
  tokenXAmount: bigint;
  tokenYAmount: bigint;
  fees: PoolFees;
};
type InitializePoolConfig = Array<PoolConfig>;
async function initializePools(sdk: HydraSDK, config: InitializePoolConfig) {
  for (const pool of config) {
    await initializePool(sdk, pool);
  }
}

function getMintKeyFromSymbol(symbol: string, network: Network) {
  const asset = getAsset(symbol, network);
  return new PublicKey(asset.address);
}

async function initializePool(sdk: HydraSDK, pool: PoolConfig) {
  const tokenXKey = getMintKeyFromSymbol(pool.tokenX, sdk.ctx.network);
  const tokenYKey = getMintKeyFromSymbol(pool.tokenY, sdk.ctx.network);
  await sdk.liquidityPools.initialize(tokenXKey, tokenYKey, pool.fees);

  await sdk.liquidityPools.addLiquidity(
    tokenYKey,
    tokenYKey,
    pool.tokenXAmount,
    pool.tokenYAmount
  );
}

type InitializeTraderConfig = {
  traderKey: string;
  tokens: Array<{ symbol: string; amount: bigint }>;
};
async function initializeTrader(
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

  const payer = (sdk.ctx.provider.wallet as NodeWallet).payer;

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

// Amounts and wallets are different based on network
// Hydra SDK has the god wallet in it's provider
export async function setupPools(sdk: HydraSDK) {
  // Get the config
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
}
