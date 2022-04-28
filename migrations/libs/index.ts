import * as anchor from "@project-serum/anchor";
import TokensMap from "config-ts/tokens.json";
import { loadKey } from "hydra-ts/src/node"; // these should be moved out of test
import { HydraSDK, Network } from "hydra-ts";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import NetworkMap from "config-ts/network-map.json";

type Token = {
  chainId: number;
  address: string;
  name: string;
  decimals: number;
  symbol: string;
  logoURI: string;
};

export async function loadTokens(network: Network) {
  // select tokens from
  const tokens = TokensMap[network] as Token[];
  let out: any = {};
  let entries = Object.entries(tokens) as Array<[string, Token]>;
  for (let [, { address, symbol }] of entries) {
    const keypair = await loadKey(`keys/localnet/tokens/${address}.json`);
    out[symbol.toLowerCase()] = keypair;
  }

  return out;
}

export function getNetworkFromUrl(url: string) {
  const [network] = Object.entries(NetworkMap).find(([k, v]) => v === url) ?? [
    null,
  ];
  if (!network) throw new Error("Invalid Network");
  return network as Network;
}

export function getNetworkFromProvider(provider: anchor.Provider) {
  const url = (provider.connection as any)._rpcEndpoint;

  return getNetworkFromUrl(url);
}

export async function setupStakingState(
  provider: anchor.Provider,
  network: Network,
  tokens: any
) {
  // const hydraStaking = new anchor.web3.PublicKey(
  //   config.localnet.programIds.hydraStaking
  // );

  // const program = new anchor.Program<staking.HydraStaking>(
  //   staking.IDL,
  //   hydraStaking
  // );
  const redeemableMint = tokens["xhyd"];
  const tokenMint = tokens["hyd"];

  const sdk = HydraSDK.createFromAnchorProvider(provider, network);

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
deployingAs:\t\t${sdk.ctx.provider.wallet.publicKey}
poolStatePubkey:\t${poolStatePubkey}
tokenVaultPubkey:\t${await sdk.staking.accounts.tokenVault.key()}
tokenMint:\t\t${tokenMint.publicKey}
redeemableMint:\t\t${redeemableMint.publicKey}
  `);

  await sdk.staking.initialize(tokenVaultBump, poolStateBump);
}

export async function createMintAssociatedVaultFromAsset(
  sdk: HydraSDK,
  asset: Token | undefined,
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

export function getAsset(symbol: string, network: Network) {
  return TokensMap[network].find(
    (asset: Token) => asset.symbol.toLowerCase() === symbol.toLowerCase()
  );
}

export async function setupLiquidityPoolState(
  provider: anchor.Provider,
  network: Network,
  tokens: any
) {
  // The idea here is we use the provider.wallet as "god" mint tokens to them
  // and then transfer those tokens to to a "trader" account
  const sdk = HydraSDK.createFromAnchorProvider(provider, network);

  // 1. create and distribute tokens to the god wallet
  const list = [
    { asset: getAsset("usdc", network), amount: 100_000_000_000000n }, // 100,000,000.000000
    { asset: getAsset("wbtc", network), amount: 100_000_000n * 100_000_000n },
    { asset: getAsset("weth", network), amount: 100_000_000_000000000n }, // 100,000,000.000000000
    { asset: getAsset("wsol", network), amount: 100_000_000n * 1_000_000_000n },
  ];

  let atas = [];
  for (let { asset, amount } of list) {
    atas.push(await createMintAssociatedVaultFromAsset(sdk, asset, amount));
  }

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
    1_000n * 1_000_000_000n,
    45_166_800n * 1_000_000n
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
    1_000n * 1_000_000_000n,
    3_281_000n * 1_000_000n
  );
  // Load up a trader account
  const trader = await loadKey(
    `keys/localnet/users/usrQpqgkvUjPgAVnGm8Dk3HmX3qXr1w4gLJMazLNyiW.json`
  );

  await provider.connection.confirmTransaction(
    await provider.connection.requestAirdrop(trader.publicKey, 10000000000),
    "confirmed"
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
