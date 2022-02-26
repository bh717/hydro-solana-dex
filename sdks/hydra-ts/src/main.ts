import { Connection } from "@solana/web3.js";
import { getProgramIds } from "./config/get-program-ids";
import { createCtx, createReadonlyCtx } from "./ctx";
import staking from "./staking";
import { Ctx, Network, Wallet } from "./types";
import * as utils from "./utils";
import { inject } from "./utils/meta-utils";

/**
 * Create an instance of the sdk API
 * @param ctx A Ctx
 * @returns An Sdk instance
 */
export function createApi(ctx: Ctx) {
  return {
    ...inject(
      {
        staking,
      },
      ctx
    ),
    utils,
  };
}

export type HydraAPI = ReturnType<typeof createApi>;

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
      ? createCtx(wallet, connection, programIds)
      : createReadonlyCtx(connection, programIds);

    const api = createApi(ctx);

    return api;
  },
};
