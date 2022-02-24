import { Wallet, ProgramIds, Ctx, Network } from "../types";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { utils, web3, Program, Provider } from "@project-serum/anchor";
import stakingIdl from "target/idl/hydra_staking.json";
import { HydraStaking } from "types-ts/codegen/types/hydra_staking";

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

  /**
   * Return the first tokenAccount publicKey for the given mint address
   * @param mint mintAddress
   * @returns publicKey
   */
  async function getOwnerTokenAccount(mint: PublicKey) {
    const { pubkey } = (
      await provider.connection.getTokenAccountsByOwner(
        provider.wallet.publicKey,
        {
          mint,
        }
      )
    ).value[0];
    return pubkey;
  }

  // TODO: Can revisit if we create / require more seed patterns
  /**
   *
   * @param seedId
   * @param publicKeySeeds
   * @returns
   */
  async function getPDA(...seeds: (PublicKey | string)[]) {
    const [pubkey, bump] = await web3.PublicKey.findProgramAddress(
      seeds.map((seed) => {
        if (typeof seed === "string") return utils.bytes.utf8.encode(seed);
        return seed.toBuffer();
      }),
      hydraStaking.programId
    );
    return [pubkey, bump] as [typeof pubkey, typeof bump];
  }

  return {
    connection: provider.connection,
    wallet: provider.wallet,
    programs: { hydraStaking },
    provider,
    getKey,
    getOwnerTokenAccount,
    getPDA,
  };
}
