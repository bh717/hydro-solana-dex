# Running this example

1. Ensure your phantom wallet private key matches the key you are running your deployment scripts with. (Defaults to `~/.config/solana/id.json`)
2. From root folder:
3. Terminal 1: `solana-test-validator --reset`
4. Terminal 2: `yarn && anchor build && anchor deploy && yarn build && make migrate`
5. Run this project: `cd examples/sdk && yarn start`

Connect your wallet to see the accounts that are related to your wallet.

You will see a list of accounts a stake button and a field for the amount to stake.

Add a value within the stake field (say 1000)

Click stake.

Note the values change because they are reactive using `rxjs`.

## API Examples

Each namespace has a set of AccountLoader objects which act as
a shorthand for getting accounts and account streams.
These namespaced accounts are deterministic based on the context they are given
Usually they are:

- Cannonical associated token accounts
- PDAs based on particular seeds
- ProgramIDs / Accounts directly from global config

```ts
sdk.staking.accounts.userToken.balance();
```

If you need other accounts you might want to use your own `AccountLoader`

```ts
import { AccountLoader } from "hydra-ts";
type PublicKeyGetter = () => Promise<PublicKey | [number,Publickey]>;
type ParserType = "token" | "mint";
type Parser<T> = (AccountInfo<Buffer>) => T
type ParserArg<T = any> = ParserType | Parser<T>
const loader = new AccountLoader(fetchPublicKey, "token" | "mint" | CustomParser));
const balance = await loader.balance(); // Returns the Token Balance (assuming it is a token) Will throw an error if it is not
const key = await loader.key(); // Returns the public key
const info = await loader.info(); // Get info with data parsed as if it is an SPLToken
const stream$ = loader.stream(); // Returns a stream of info objects
```
