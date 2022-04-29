import * as anchor from "@project-serum/anchor";

import { loadKey } from "hydra-ts/src/node"; // these should be moved out of test
import { Asset, Network } from "hydra-ts";
import NetworkMap from "config-ts/network-map.json";
import { Keypair } from "@solana/web3.js";
import { getAssets } from "./getAsset";

export async function loadKeypairsFromFiles(network: Network) {
  // select tokens from
  const tokens = getAssets(network);
  let out = new Map<string, Keypair>();
  let entries = Object.entries(tokens) as Array<[string, Asset]>;
  for (let [, { address, symbol }] of entries) {
    const keypair = await loadKey(`keys/tokens/${address}.json`);
    out.set(symbol.toLowerCase(), keypair);
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

// export async function setupStakingState(
//   provider: anchor.Provider,
//   network: Network,
//   tokens: Tokens
// ) {
//   // const hydraStaking = new anchor.web3.PublicKey(
//   //   config.localnet.programIds.hydraStaking
//   // );

//   // const program = new anchor.Program<staking.HydraStaking>(
//   //   staking.IDL,
//   //   hydraStaking
//   // );
//   const redeemableMint = tokens.getKey("xhyd");
//   const tokenMint = tokens.getKey("hyd");

//   const sdk = HydraSDK.createFromAnchorProvider(provider, network);

//   console.log("Creating mint and vault...");

//   // create tokenMint
//   await sdk.common.createMintAndAssociatedVault(tokenMint, 100_000_000n);

//   const tokenVaultPubkey = await sdk.staking.accounts.tokenVault.key();
//   const tokenVaultBump = await sdk.staking.accounts.tokenVault.bump();

//   console.log("Creating mint...");
//   await sdk.common.createMint(redeemableMint, tokenVaultPubkey, 9);

//   const poolStatePubkey = await sdk.staking.accounts.poolState.key();
//   const poolStateBump = await sdk.staking.accounts.poolState.bump();

//   console.log("Initializing...");
//   console.log(`
// deployingAs:\t\t${sdk.ctx.provider.wallet.publicKey}
// poolStatePubkey:\t${poolStatePubkey}
// tokenVaultPubkey:\t${await sdk.staking.accounts.tokenVault.key()}
// tokenMint:\t\t${tokenMint.publicKey}
// redeemableMint:\t\t${redeemableMint.publicKey}
//   `);

//   await sdk.staking.initialize(tokenVaultBump, poolStateBump);
// }

// export async function setupLiquidityPoolState(
//   provider: anchor.Provider,
//   network: Network,
//   tokens: Tokens
// ) {
//   // The idea here is we use the provider.wallet as "god" mint tokens to them
//   // and then transfer those tokens to to a "trader" account
//   const sdk = HydraSDK.createFromAnchorProvider(provider, network);

//   // 1. create and distribute tokens to the god wallet
//   const list = [
//     { asset: getAsset("usdc", network), amount: 100_000_000_000000n }, // 100,000,000.000000
//     { asset: getAsset("wbtc", network), amount: 100_000_000n * 100_000_000n },
//     { asset: getAsset("weth", network), amount: 100_000_000_000000000n }, // 100,000,000.000000000
//     { asset: getAsset("wsol", network), amount: 100_000_000n * 1_000_000_000n },
//   ];

//   let atas = [];
//   for (let { asset, amount } of list) {
//     atas.push(await createMintAssociatedVaultFromAsset(sdk, asset, amount));
//   }

//   const fees = {
//     swapFeeNumerator: 1n,
//     swapFeeDenominator: 500n,
//     ownerTradeFeeNumerator: 0n,
//     ownerTradeFeeDenominator: 0n,
//     ownerWithdrawFeeNumerator: 0n,
//     ownerWithdrawFeeDenominator: 0n,
//     hostFeeNumerator: 0n,
//     hostFeeDenominator: 0n,
//   };

//   // 2. Initialize a couple of pools

//   // Create the wbtc usdc pool
//   await sdk.liquidityPools.initialize(
//     tokens.getKey("wbtc").publicKey,
//     tokens.getKey("usdc").publicKey,
//     fees
//   );

//   await sdk.liquidityPools.addLiquidity(
//     tokens.getKey("wbtc").publicKey,
//     tokens.getKey("usdc").publicKey,
//     1_000n * 1_000_000_000n,
//     45_166_800n * 1_000_000n
//   );

//   // Create the weth usdc pool
//   await sdk.liquidityPools.initialize(
//     tokens.getKey("weth").publicKey,
//     tokens.getKey("usdc").publicKey,
//     fees
//   );
//   await sdk.liquidityPools.addLiquidity(
//     tokens.getKey("weth").publicKey,
//     tokens.getKey("usdc").publicKey,
//     1_000n * 1_000_000_000n,
//     3_281_000n * 1_000_000n
//   );

//   // Load up a trader account
//   const trader = await loadKey(
//     `keys/users/usrQpqgkvUjPgAVnGm8Dk3HmX3qXr1w4gLJMazLNyiW.json`
//   );

//   await provider.connection.confirmTransaction(
//     await provider.connection.requestAirdrop(trader.publicKey, 10000000000),
//     "confirmed"
//   );

//   // 3. Transfer some funds to the trader account
//   const traderUsdc = await sdk.common.createAssociatedAccount(
//     tokens.getKey("usdc").publicKey,
//     trader,
//     (provider.wallet as NodeWallet).payer
//   );
//   await sdk.common.transfer(atas[0], traderUsdc, 100n * 1_000_000n);

//   const traderBtc = await sdk.common.createAssociatedAccount(
//     tokens.getKey("wbtc").publicKey,
//     trader,
//     (provider.wallet as NodeWallet).payer
//   );
//   await sdk.common.transfer(atas[1], traderBtc, 100n * 1_000_000n);

//   const traderEth = await sdk.common.createAssociatedAccount(
//     tokens.getKey("weth").publicKey,
//     trader,
//     (provider.wallet as NodeWallet).payer
//   );
//   await sdk.common.transfer(atas[2], traderEth, 100n * 1_000_000n);

//   const traderSol = await sdk.common.createAssociatedAccount(
//     tokens.getKey("sol").publicKey,
//     trader,
//     (provider.wallet as NodeWallet).payer
//   );
//   await sdk.common.transfer(atas[3], traderSol, 100n * 1_000_000n);

//   // Ok so now if you load up the private keys for both god and the
//   // trader in your test wallet, you should be able to play around with the app on localhost:

//   // yarn private-key ./keys/users/usrQpqgkvUjPgAVnGm8Dk3HmX3qXr1w4gLJMazLNyiW.json
//   // yarn private-key ~/.config/solana/id.json
// }

// async function generateTokens(network: Network, keys: Map<string, Keypair>) {
//   // generate keys from scratch
//   // return Map<string, Token>
//   const tokens = getAssets(network);

//   const map = new Map<string, Asset>();
//   for (let token of tokens) {
//     const key = keys.get(token.symbol);
//     if (!key) throw new Error("Symbol not found");
//     const address = key.publicKey.toString();
//     map.set(token.symbol, {
//       ...token,
//       address,
//     });
//   }
//   return map;
// }

// async function generateTokenKeys(network: Network) {
//   const tokens = getAssets(network);

//   const keys = new Map<string, Keypair>();
//   for (let token of tokens) {
//     const keypair = Keypair.generate();
//     keys.set(token.symbol, keypair);
//   }
//   return keys;
// }

// async function loadTokensFromStore(network: Network) {
//   // load keys from file
//   const tokens = getAssets(network);

//   const map = new Map<string, Asset>();
//   for (let token of tokens) {
//     map.set(token.symbol, token);
//   }
//   return map;
// }

// async function saveTokenKeysMeta(
//   keys: Map<string, Keypair>,
//   tokens: Map<string, Asset>,
//   network: Network
// ) {
//   for (const [, key] of keys) {
//     await saveKey(key);
//   }
//   const tokenPath = "sdks/config-ts/tokens.json";
//   const tokensObject = JSON.parse(
//     JSON.stringify(getTokenStore())
//   ) as ReturnType<typeof getTokenStore>;

//   tokensObject[network] = [...tokens.values()];
//   fs.writeFileSync(tokenPath, JSON.stringify(tokensObject, null, 2));
// }

// async function createToken(network: Network, generate: boolean) {
//   let keys: Map<string, Keypair>;
//   let tokens: Map<string, Asset>;
//   if (generate) {
//     keys = await generateTokenKeys(network);
//     tokens = await generateTokens(network, keys);
//   } else {
//     tokens = await loadTokensFromStore(network);
//     keys = await loadKeypairsFromFiles(network);
//   }

//   return {
//     get(symbol: string) {
//       return tokens.get(symbol);
//     },
//     getKey(symbol: string) {
//       return keys.get(symbol);
//     },
//     // save
//     async save() {
//       await saveTokenKeysMeta(keys, tokens, network);
//     },
//   };
// }
// export type Task<T> = () => Promise<T>;
// type Tokens = PromiseVal<ReturnType<typeof createToken>>;

// export const Tokens = {
//   create: createToken,
// };
