import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  useAnchorWallet,
  useConnection,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { HydraSDK } from "hydra-ts";
import { FC, ReactNode, useMemo } from "react";

require("./App.css");
require("@solana/wallet-adapter-react-ui/styles.css");

const App: FC = () => {
  return (
    <Context>
      <Content />
    </Context>
  );
};
export default App;

const Context: FC<{ children: ReactNode }> = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded.
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
      new SolletWalletAdapter({ network }),
      new SolletExtensionWalletAdapter({ network }),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

const Content: FC = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const handleDemoClicked = async () => {
    // Example of how you can create an instance of the sdk
    // You don't want to do this in a production app.
    // Instead you would want to create a context and provide to
    // components that need the sdk via a custom hook
    const sdk = HydraSDK.create("localnet", connection, wallet);

    // This is a wasm call
    const answer = await sdk.staking.calculatePoolTokensForDeposit(
      100n,
      2000n,
      100_000_000n
    );

    // alert the answer
    alert(answer);
  };

  const handleStakeClicked = async () => {
    // Example of how you can create an instance of the sdk
    // You don't want to do this in a production app.
    // Instead you would want to create a context and provide to
    // components that need the sdk via a custom hook
    const sdk = HydraSDK.create("localnet", connection, wallet);

    await sdk.staking.stake(1000n);
  };
  return (
    <div className="App">
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: 20 }}>
          <WalletMultiButton />
        </div>
        <button onClick={handleDemoClicked}>Demonstrate Calculate</button>
        <button onClick={handleStakeClicked}>Stake 1000</button>
      </div>
    </div>
  );
};
