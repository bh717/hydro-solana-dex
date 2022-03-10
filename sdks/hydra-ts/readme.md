# hydra-ts

Javascript SDK for hydra.

- Uses wasm components
- Isomorphic deployment target
- `src/node` folder is built out to be imported within node contexts Eg. `import {loadKey} from "hydra-ts/node"`

## Build

`yarn build`

## Test

`yarn test`

## Usage

```ts
const sdk = HydraSDK.create("localnet", connection, wallet);

await sdk.staking.stake(1000n);

// Or if you want to watch the state change while executing the stake
const stakedPromise = await sdk.staking.stake(1000n);

// Fetch accounts for the namespace within the current context
const accounts = sdk.staking.accounts; // getter constructs accounts
await accounts.redeemable.info(); // returns full AccountInfo
await accounts.tokenVault.balance(); // returns tokenBalance
await accounts.poolState.info();

// Stream of account info values
const userToken$ = sdk.staking.accounts.userToken.stream();

const unsub = accounts.poolState.onChange(callback, commitment); // callback (commitment is optional)

unsub(); // clean up listeners
```
