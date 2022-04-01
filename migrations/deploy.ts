// This is not run with anchor migrate
import * as anchor from "@project-serum/anchor";
import config from "config-ts/global-config.json";
import * as staking from "types-ts/codegen/types/hydra_staking";
// import * as liquidityPools from "types-ts/codegen/types/hydra_liquidity_pools";
import { tokens as localnetTokens } from "config-ts/tokens/localnet.json";
import { loadKey } from "hydra-ts/node"; // these should be moved out of test
import { HydraSDK } from "hydra-ts";
import { Keypair } from "@solana/web3.js";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";

type Token = {
  chainId: number;
  address: string;
  name: string;
  decimals: number;
  symbol: string;
  logoURI: string;
};
// type Lookup<T> = Record<keyof T, Keypair>;
async function loadTokens(tokens: typeof localnetTokens) {
  let out: any = {};
  let entries = Object.entries(tokens) as Array<[string, Token]>;
  for (let [, { address, symbol }] of entries) {
    const keypair = await loadKey(`keys/localnet/tokens/${address}.json`);
    out[symbol.toLowerCase()] = keypair;
  }

  return out;
}

// type LocalTokens = Record<keyof typeof localnetTokens, Keypair>;

async function setupStakingState(provider: anchor.Provider, tokens: any) {
  const hydraStaking = new anchor.web3.PublicKey(
    config.localnet.programIds.hydraStaking
  );

  const program = new anchor.Program<staking.HydraStaking>(
    staking.IDL,
    hydraStaking
  );
  const redeemableMint = tokens["xhyd"];
  const tokenMint = tokens["hyd"];

  const programMap = {
    hydraStaking: program.programId.toString(),
    redeemableMint: redeemableMint.publicKey.toString(),
    tokenMint: tokenMint.publicKey.toString(),
  };

  const sdk = HydraSDK.createFromAnchorProvider(provider, {
    ...config.localnet.programIds,
    ...programMap,
  });

  console.log("Creating mint and vault...");

  // create tokenMint
  await sdk.common.createMintAndAssociatedVault(tokenMint, 100_000_000n);

  const tokenVaultPubkey = await sdk.staking.accounts.tokenVault.key();
  const tokenVaultBump = await sdk.staking.accounts.tokenVault.bump();

  console.log("Creating mint...");
  await sdk.common.createMint(redeemableMint, tokenVaultPubkey, 9);

  const poolStatePubkey = await sdk.staking.accounts.poolState.key();
  const poolStateBump = await sdk.staking.accounts.poolState.bump();

  console.log("Initializing...");
  console.log(`
deployingAs:\t${sdk.ctx.provider.wallet.publicKey}
poolStatePubkey:\t${poolStatePubkey}
tokenVaultPubkey:\t${await sdk.staking.accounts.tokenVault.key()}
tokenMint:\t\t${tokenMint.publicKey}
redeemableMint:\t\t${redeemableMint.publicKey}
  `);

  await sdk.staking.initialize(tokenVaultBump, poolStateBump);
}

type Asset = typeof localnetTokens[0];

async function createMintAssociatedVaultFromAsset(
  sdk: HydraSDK,
  asset: Asset | undefined,
  amount: bigint
) {
  if (!asset) throw new Error("Asset not provided!");
  console.log("Creating " + asset.name);
  const keypair = await loadKey(`keys/localnet/tokens/${asset.address}.json`);

  const [, ata] = await sdk.common.createMintAndAssociatedVault(
    keypair,
    amount,
    sdk.ctx.provider.wallet.publicKey,
    asset.decimals
  );
  console.log(`${asset.name}ATA: ${ata}\n`);
  return ata;
}

function getAsset(symbol: string) {
  return localnetTokens.find(
    (asset) => asset.symbol.toLowerCase() === symbol.toLowerCase()
  );
}

async function setupLiquidityPoolState(provider: anchor.Provider, tokens: any) {
  // The idea here is we use the provider.wallet as "god" mint tokens to them
  // and then transfer those tokens to to a "trader" account
  const sdk = HydraSDK.createFromAnchorProvider(provider, "localnet");

  // 1. create and distribute tokens to the god wallet
  const list = [
    { asset: getAsset("usdc"), amount: 100_000_000_000000n }, // 100,000,000.000000
    { asset: getAsset("wbtc"), amount: 100_000_000n * 100_000_000n },
    { asset: getAsset("weth"), amount: 100_000_000_000000000n }, // 100,000,000.000000000
    { asset: getAsset("sol"), amount: 100_000_000n * 1_000_000_000n },
  ];

  let atas = [];
  for (let { asset, amount } of list) {
    atas.push(await createMintAssociatedVaultFromAsset(sdk, asset, amount));
  }

  // console.log("Creating usdc...");
  // const [, usdcATA] = await sdk.common.createMintAndAssociatedVault(
  //   tokens.usdc,
  //   100_000_000n * 1_000_000n,
  //   sdk.ctx.provider.wallet.publicKey,
  //   decimals: tokens.
  // );
  // console.log(`usdcATA: ${usdcATA}\n`);
  // console.log("Creating wbtc...");
  // const [, wbtcATA] = await sdk.common.createMintAndAssociatedVault(
  //   tokens.wbtc,
  //   100_000_000n * 100_000_000n
  // );
  // console.log(`wbtcATA: ${wbtcATA}\n`);
  // console.log("Creating weth...");
  // const [, wethATA] = await sdk.common.createMintAndAssociatedVault(
  //   tokens.weth,
  //   100_000_000n * 1_000_000_000n
  // );
  // console.log(`wethATA: ${wethATA}\n`);
  // console.log("Creating sol...");
  // const [, solATA] = await sdk.common.createMintAndAssociatedVault(
  //   tokens.sol,
  //   100_000_000n * 1_000_000_000n
  // );
  // console.log(`solATA: ${solATA}\n`);

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

  // 2. Initialize a couple of pools

  // Create the wbtc usdc pool
  await sdk.liquidityPools.initialize(
    tokens.wbtc.publicKey,
    tokens.usdc.publicKey,
    fees
  );

  await sdk.liquidityPools.addLiquidity(
    tokens.wbtc.publicKey,
    tokens.usdc.publicKey,
    2_084_000n,
    100_000_000_000n,
    0n
  );

  // Create the weth usdc pool
  await sdk.liquidityPools.initialize(
    tokens.weth.publicKey,
    tokens.usdc.publicKey,
    fees
  );
  await sdk.liquidityPools.addLiquidity(
    tokens.weth.publicKey,
    tokens.usdc.publicKey,
    1_000_000n * 1_000_000_000n,
    1_000_000n * 1_000_000n,
    0n
  );
  // Load up a trader account
  const trader = await loadKey(
    `keys/localnet/users/usrQpqgkvUjPgAVnGm8Dk3HmX3qXr1w4gLJMazLNyiW.json`
  );

  // 3. Transfer some funds to the trader account
  const traderUsdc = await sdk.common.createAssociatedAccount(
    tokens.usdc.publicKey,
    trader,
    (provider.wallet as NodeWallet).payer
  );
  await sdk.common.transfer(atas[0], traderUsdc, 100n * 1_000_000n);

  const traderBtc = await sdk.common.createAssociatedAccount(
    tokens.wbtc.publicKey,
    trader,
    (provider.wallet as NodeWallet).payer
  );
  await sdk.common.transfer(atas[1], traderBtc, 100n * 1_000_000n);

  const traderEth = await sdk.common.createAssociatedAccount(
    tokens.weth.publicKey,
    trader,
    (provider.wallet as NodeWallet).payer
  );
  await sdk.common.transfer(atas[2], traderEth, 100n * 1_000_000n);

  const traderSol = await sdk.common.createAssociatedAccount(
    tokens.sol.publicKey,
    trader,
    (provider.wallet as NodeWallet).payer
  );
  await sdk.common.transfer(atas[3], traderSol, 100n * 1_000_000n);

  // Ok so now if you load up the private keys for both god and the
  // trader in your test wallet, you should be able to play around with the app on localhost:

  // yarn private-key ./keys/users/usrQpqgkvUjPgAVnGm8Dk3HmX3qXr1w4gLJMazLNyiW.json
  // yarn private-key ~/.config/solana/id.json
}

export default async function (provider: anchor.Provider) {
  anchor.setProvider(provider);
  const tokens = await loadTokens(localnetTokens);
  await setupStakingState(provider, tokens);
  await setupLiquidityPoolState(provider, tokens);
}
