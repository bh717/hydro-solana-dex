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
