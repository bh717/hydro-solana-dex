import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { HydraPools } from '../../target/types/hydra_pools';

describe('hydra-pools', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.HydraPools as Program<HydraPools>;

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});