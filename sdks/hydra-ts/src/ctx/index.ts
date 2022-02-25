import { Wallet, ProgramIds, Ctx } from "../types";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, Provider } from "@project-serum/anchor";
import stakingIdl from "target/idl/hydra_staking.json";
import { HydraStaking } from "types-ts/codegen/types/hydra_staking";
import * as utils from "../utils/utils";
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
  const typedStakingIdl = stakingIdl as any as HydraStaking;

  // Create our program objects
  const hydraStaking = new Program(
    typedStakingIdl,
    programIds.hydraStaking,
    provider
  );

  /**
   * Lookup public key from initial programIds
   * @param name
   * @returns
   */
  function getKey(name: keyof ProgramIds) {
    return new PublicKey(programIds[name]);
  }

  return {
    connection: provider.connection,
    wallet: provider.wallet,
    programs: { hydraStaking },
    provider,
    getKey,
    utils,
  };
}
