import { Provider } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { getProgramIds } from "./config/get-program-ids";
import { createCtx, createReadonlyCtx, createCtxAnchor } from "./ctx";
import { Ctx, Network, ProgramIds, Wallet } from "./types";
import { inject } from "./utils/meta-utils";
import common from "./common";
import staking from "./staking";
import user from "./user";
import liquidityPools from "./liquidity-pools";
import accountLoaders from "./accountLoaders";

/**
 * Create an instance of the sdk API
 * @param ctx A Ctx
 * @returns An Sdk instance
 */
export function createApi(ctx: Ctx) {
  const namespaceFns = {
    accountLoaders,
    staking,
    liquidityPools,
    common,
    user,
  };

  return {
    ...inject(namespaceFns, ctx),
    ctx,
  };
}

function isNetwork(value: any): value is Network {
  return typeof value === "string";
}

export type HydraSDK = ReturnType<typeof createApi>;

/**
 * Base object for instantiating the SDK for use on the client.
 */
export const HydraSDK = {
  /**
   * Create an instance of the SDK.
   * @param network One of either `mainnet`, `testnet`, `devnet` or `localnet` this informs which programIds are supplied to the system.
   * @param endpoint The RPC endpoint the application will be connecting to.
   * @param wallet An optional wallet to sign transactions. If left out a readonly SDK will be created.
   * @returns HydraAPI
   */
  create(
    network: Network,
    connectionOrEndpoint: Connection | string,
    wallet?: Wallet
  ) {
    const programIds = getProgramIds(network);
    const connection =
      typeof connectionOrEndpoint === "string"
        ? new Connection(connectionOrEndpoint)
        : connectionOrEndpoint;
    const ctx = wallet
      ? createCtx(wallet, connection, programIds, network)
      : createReadonlyCtx(connection, programIds, network);
    const api = createApi(ctx);
    return api;
  },

  /**
   * Creates an SDK instance configured for tests using an anchor provider.
   * @param provider Anchor provider
   * @param programIdsOrNetwork Map of program ids to build off for testing or a network string
   * @returns HydraAPI
   */
  createFromAnchorProvider(
    provider: Provider,
    programIdsOrNetwork: ProgramIds | Network
  ) {
    const programIds = isNetwork(programIdsOrNetwork)
      ? getProgramIds(programIdsOrNetwork)
      : programIdsOrNetwork;
    const network = isNetwork(programIdsOrNetwork)
      ? programIdsOrNetwork
      : undefined;
    const ctx = createCtxAnchor(provider, programIds, network);
    return createApi(ctx);
  },
};
