import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { HydraBenchmarks } from '../../target/types/hydra_benchmarks';
// @ts-ignore
import assert from "assert";

describe('hydra-benchmarks', () => {
  anchor.setProvider(anchor.Provider.env());

  const { SystemProgram } = anchor.web3;
  const program = anchor.workspace.HydraBenchmarks as Program<HydraBenchmarks>;
  const provider = anchor.Provider.env();
  const benchAccount = anchor.web3.Keypair.generate();

  it('Is initialized!', async () => {
    await program.rpc.initialize(provider.wallet.publicKey, {
      accounts: {
        benchmarkResult: benchAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [benchAccount],
    });

    const benchmarkResult = await program.account.benchmarkResult.fetch(benchAccount.publicKey);

    // @ts-ignore
    assert.ok(benchmarkResult.xNew.eq(new anchor.BN(0)));
  });

  it('Runs on chain benchmarks', async () => {
    await program.rpc.lnBenchmark({
      accounts: {
        benchmarkResult: benchAccount.publicKey,
        authority: provider.wallet.publicKey,
      },
    });
  });
});
