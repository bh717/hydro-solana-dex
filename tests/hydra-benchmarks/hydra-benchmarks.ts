import * as anchor from "@project-serum/anchor";
import config from "config-ts/global-config.json";
import * as benchmarks from "types-ts/codegen/types/hydra_benchmarks";

describe("hydra-benchmarks", () => {
  anchor.setProvider(anchor.Provider.env());

  const hydraBenchmarks = new anchor.web3.PublicKey(
    config.localnet.programIds.hydraBenchmarks
  );
  const program = new anchor.Program(benchmarks.IDL, hydraBenchmarks);

  it("runs the benchmarked functions on chain", async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
