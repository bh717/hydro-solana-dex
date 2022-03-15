import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import config from "config-ts/global-config.json";
import * as hydrafarming from "types-ts/codegen/types/hydra_farming";

describe("hydra-farming", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const hydraFarming = new anchor.web3.PublicKey(
    config.localnet.programIds.hydraFarming
  );
  const program = new anchor.Program(hydrafarming.IDL, hydraFarming);

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
