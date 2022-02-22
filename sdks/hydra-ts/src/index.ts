import { Wallet, ProgramIds, Ctx } from "./types";
import { Connection } from "@solana/web3.js";
import { Program, Provider } from "@project-serum/anchor";
import stakingIdl from "target/idl/hydra_staking.json";
import { HydraStaking } from "target/types/hydra_staking";
import {
  calculatePoolTokensForDeposit,
  calculatePoolTokensForWithdraw,
  stake,
  unstake,
} from "./staking";
import { injectContext } from "./utils/curry-arg";

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

/**
 * Create context from within an anchor test
 * @param provider Anchor provider
 * @param programIds A map of programIds for the SDK
 * @returns Ctx
 */
export function createCtxAnchor(
  provider: Provider,
  programIds: ProgramIds
): Ctx {
  const typedStakingIdl = stakingIdl as any as HydraStaking;
  const hydraStaking = new Program(
    typedStakingIdl,
    programIds.hydraStaking,
    provider
  );

  return {
    connection: provider.connection,
    wallet: provider.wallet,
    programs: { hydraStaking },
    provider,
  };
}

/**
 * Create an instance of the sdk
 * @param ctx A Ctx
 * @returns An Sdk instance
 */
export function createSdk(ctx: Ctx) {
  const staking = injectContext(
    {
      calculatePoolTokensForDeposit,
      calculatePoolTokensForWithdraw,
      stake,
      unstake,
    },
    ctx
  );

  // Organised by namespace
  return {
    staking,
  };
}
