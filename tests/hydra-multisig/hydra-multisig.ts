import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { HydraMultisig } from '../../target/types/hydra_multisig';

describe('hydra-multisig', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.HydraMultisig as Program<HydraMultisig>;

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
