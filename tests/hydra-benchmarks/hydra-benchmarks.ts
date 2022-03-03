import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import * as localJsonIdl from "../../target/idl/hydra_benchmarks.json";
import { HydraBenchmarks, IDL } from "types-ts/codegen/types/hydra_benchmarks";

describe("hydra-benchmarks", () => {
  anchor.setProvider(anchor.Provider.env());

  const hydraBenchmarks = new anchor.web3.PublicKey(
    localJsonIdl["metadata"]["address"]
  );
  const program = new anchor.Program(
    IDL,
    hydraBenchmarks
  ) as Program<HydraBenchmarks>;

  it("runs the benchmarked functions on chain", async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
