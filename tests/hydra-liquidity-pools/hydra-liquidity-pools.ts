import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { HydraLiquidityPools } from '../../target/types/hydra_liquidity_pools';
import assert from "assert";

// describe('hydra-liquidity-pools', () => {
//
//   // Configure the client to use the local cluster.
//   anchor.setProvider(anchor.Provider.env());
//
//   const { SystemProgram } = anchor.web3;
//   const program = anchor.workspace.HydraPools as Program<HydraPools>;
//   const provider = anchor.Provider.env();
//   // Swap Account
//   const swapAccount = anchor.web3.Keypair.generate();
//
//   it('Is initialized!', async () => {
//     // Add your test here.
//     // const tx = await program.rpc.initialize({});
//     // console.log("Your transaction signature", tx);
//
//     // Create the new account and initialize it with the program.
//     await program.rpc.initialize(provider.wallet.publicKey, {
//       accounts: {
//         swapResult: swapAccount.publicKey,
//         user: provider.wallet.publicKey,
//         systemProgram: SystemProgram.programId,
//       },
//       signers: [swapAccount],
//     });
//
//     // Fetch the newly created account from the cluster.
//     const swapResult = await program.account.swapResult.fetch(swapAccount.publicKey);
//
//     // @ts-ignore
//     assert.ok(swapResult.xNew.eq(new anchor.BN(0)));
//   });
//
//   it('Swaps using AMM', async () => {
//     // Invoke the swap AMM rpc.
//     await program.rpc.swapAmm({
//       accounts: {
//         swapResult: swapAccount.publicKey,
//         authority: provider.wallet.publicKey,
//       },
//     });
//
//     // Fetch the swapResult
//     const swapResult = await program.account.swapResult.fetch(swapAccount.publicKey);
//
//     assert.ok(swapResult.deltaY.eq(new anchor.BN(5)));
//   });
//
//   it('Swaps using HMM', async () => {
//     // Invoke the swap HMM rpc.
//     await program.rpc.swapHmm({
//       accounts: {
//         swapResult: swapAccount.publicKey,
//         authority: provider.wallet.publicKey,
//       },
//     });
//
//     // Fetch the swapResult
//     const swapResult = await program.account.swapResult.fetch(swapAccount.publicKey);
//
//     // @ts-ignore
//     // TODO: figure out how to compare big numbers in anchor with precise numbers in sol
//     // assert.ok(swapResult.deltaY.eq(new anchor.BN(56)));
//   });
// });



describe ("hydra-poolz", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const { SystemProgram } = anchor.web3;
  const program = anchor.workspace.HydraPools as Program<HydraLiquidityPools>;
  const provider = anchor.Provider.env();

  it('Is initialized!', async () => {
    // const newPool = anchor.web3.Keypair.generate();
    // await program.rpc.initPool(new anchor.BN(42),{
    //   accounts: {
    //     pool: newPool.publicKey,
    //     user: provider.wallet.publicKey,
    //     systemProgram: SystemProgram.programId,
    //   },
    //   signers: [newPool],
    // });
    //
    // const pool = await program.account.pool.fetch(newPool.publicKey);
    //
    // assert.ok(pool.num.eq(new anchor.BN(42)));
  });

  it('should initialize ', function () {
    
  });
});