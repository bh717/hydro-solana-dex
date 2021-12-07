import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { HydraStaking } from '../../target/types/hydra_staking';

describe('hydra-staking', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.HydraStaking as Program<HydraStaking>;

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
