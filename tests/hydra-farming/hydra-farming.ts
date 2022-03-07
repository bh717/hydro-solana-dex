import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import * as localJsonIdl from "target/idl/hydra_farming.json";
import { HydraFarming, IDL } from "types-ts/codegen/types/hydra_farming";

describe("hydra-farming", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const hydraFarming = new anchor.web3.PublicKey(
    localJsonIdl["metadata"]["address"]
  );
  const program = new anchor.Program(
    IDL,
    hydraFarming
  ) as Program<HydraFarming>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
