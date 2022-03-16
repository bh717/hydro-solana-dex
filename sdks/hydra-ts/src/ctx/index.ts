import { Wallet, ProgramIds, Ctx } from "../types";
import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import { Coder, Program, Provider } from "@project-serum/anchor";
import * as staking from "types-ts/codegen/types/hydra_staking";
import * as liquidityPools from "types-ts/codegen/types/hydra_liquidity_pools";
import * as utils from "../utils";

/**
 * Creates a context object
 * @param wallet An Anchor wallet like object
 * @param connection A connection
 * @param programIds A map of programIds for the SDK
 * @returns Ctx
 */
export function createCtx(
  wallet: Wallet,
  connection: Connection,
  programIds: ProgramIds
): Ctx {
  const provider = new Provider(connection, wallet, {});
  return createCtxAnchor(provider, programIds);
}

// create a fake wallet for when we are signed out.
function createFakeWallet(): Wallet {
  const createSignedInError = () =>
    new Error("You must connect a wallet to sign a transaction.");
  return {
    publicKey: PublicKey.default,

    signAllTransactions: () => {
      throw createSignedInError();
    },
    signTransaction: () => {
      throw createSignedInError();
    },
  };
}

export function createReadonlyCtx(
  connection: Connection,
  programIds: ProgramIds
) {
  const provider = new Provider(connection, createFakeWallet(), {});
  return createCtxAnchor(provider, programIds);
}

/**
 * Create context from within an anchor test
 * @param provider Anchor provider
 * @param programIds A map of programIds for the SDK
 * @returns Ctx
 */
export function createCtxAnchor(provider: Provider, programIds: ProgramIds) {
  // Create our program objects
  const hydraStaking = new Program(
    staking.IDL,
    programIds.hydraStaking,
    provider
  );
  const hydraLiquidityPools = new Program(
    liquidityPools.IDL,
    programIds.hydraLiquidityPools,
    provider
  );
  const programs = {
    hydraStaking,
    hydraLiquidityPools,
  };

  /**
   * Lookup public key from initial programIds
   * @param name
   * @returns
   */
  function getKey(name: keyof ProgramIds) {
    return new PublicKey(programIds[name]);
  }

  /**
   * Create a parser function to parse using the given coder
   * @param program
   * @param name
   * @returns
   */
  function getParser<T>(program: { coder: Coder<string> }, name: string) {
    return (info: AccountInfo<Buffer>) =>
      program.coder.accounts.decode(name, info.data) as T;
  }

  return {
    connection: provider.connection,
    wallet: provider.wallet,
    programs,
    provider,
    getKey,
    getParser,
    utils,
  };
}
