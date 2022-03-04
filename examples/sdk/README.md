# Running this example

1. Ensure your phantom wallet private key matches the key you are running your deployment scripts with. (Defaults to `~/.config/solana/id.json`)
2. From root folder:
3. Terminal 1: `solana-test-validator --reset`
4. Terminal 2: `anchor build && anchor deploy && yarn build && make migrate`
5. Run this project: `cd examples/sdk && yarn start`
