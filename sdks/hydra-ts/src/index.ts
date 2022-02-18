import { Wallet, ProgramIds, Ctx } from "./types";
import { Connection } from "@solana/web3.js";
import { Program, Provider } from "@project-serum/anchor";
import stakingIdl from "target/idl/hydra_staking.json";
import { HydraStaking } from "target/types/hydra_staking";
import * as stakingFns from "./staking";
import { injectContext } from "./utils/curry-arg";

export function createCtx(
  wallet: Wallet,
  connection: Connection,
  programIds: ProgramIds
): Ctx {
  const provider = new Provider(connection, wallet, {});
  return createCtxAnchor(provider, programIds);
}

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

export function createSdk(ctx: Ctx) {
  return {
    // namespacing
    staking: injectContext(stakingFns, ctx),
    // pools
  };
}
