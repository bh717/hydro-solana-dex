# Running this example

1. Ensure your phantom wallet private key matches the key you are running your deployment scripts with. (Defaults to `~/.config/solana/id.json`)
2. From root folder:
3. Terminal 1: `solana-test-validator --reset`
4. Terminal 2: `yarn && ./scripts/build.sh && anchor deploy && yarn build && make migrate`
5. Run this project: `cd examples/sdk && yarn start`

Connect your wallet to see the accounts that are related to your wallet.

You will see a list of accounts a stake button and a field for the amount to stake.

Add a value within the stake field (say 1000)

Click stake.

Note the values change because they are reactive using `rxjs`.

## API Examples

## API Docs

Each namespace has a set of AccountLoader objects which act as
a shorthand for getting accounts and account streams.
These namespaced accounts are deterministic based on the context they are given
Usually they are:

- Cannonical associated token accounts
- PDAs based on particular seeds
- ProgramIDs / Accounts directly from global config

Those accounts are available in the namespace for the module.

```ts
assert.strictEqual(await sdk.staking.accounts.userToken.balance(), 0n);
```

And are set within the `my-module/accounts.ts` file by named export:

```ts
export const tokenMint = (ctx: Ctx) => {
  return AccountLoader.Mint(ctx, ctx.getKey("tokenMint"));
};

export const redeemableMint = (ctx: Ctx) => {
  return AccountLoader.Mint(ctx, ctx.getKey("redeemableMint"));
};

export const userToken = (ctx: Ctx) => {
  return AccountLoader.AssociatedToken(ctx, ctx.getKey("tokenMint"));
};

export const userRedeemable = (ctx: Ctx) => {
  return AccountLoader.AssociatedToken(ctx, ctx.getKey("redeemableMint"));
};

// etc..
```

```ts
// Use observables in React like so to get a stream of re-rendering flat values
const userFrom = useObservable(
  useMemo(() => sdk.staking.accounts.userToken.stream(), [sdk])
);

userFrom?.pubkey; // PUblicKey
userFrom?.account.data.amount; // 1000n
```

One advantage of streams is that they are highly composable:

```ts
const { userFromBal, redeemableTo } = useObservable(
  useMemo(() =>
    combineLatest({
      userFromBal: sdk.staking.accounts.userToken.stream().pipe(map(toBalance)),
      redeemableTo: sdk.staking.accounts.redeemableTo.stream(),
    })
  )
);

userFromBal; // 100n
redeemableTo.account.amount; // etc.
```

If you need other accounts not defined as part of the anchor prject you might want to use your own `AccountLoader` passing in the public key.

```ts
import { AccountLoader } from "hydra-ts";
import { Keypair } from "@solana/web3.js";
const myAccount = Keypair.generate();
const sdk = HydraSDK.create("localnet", connection, wallet);

// Get a mint loader
const mintLoader = AccountLoader.Mint(ctx, ctx.getKey("tokenMint"));

// Get the account named PoolState from the IDL
// (unfortunately we still need to provide a type to cast to)
const customParser = ctx.getParser<PoolState>(
  ctx.programs.hydraStaking,
  "PoolState"
);

const loaderWithCustomParser = AccountLoader(
  sdk.ctx,
  myAccount.publicKey,
  customParser
);
```
