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
import { createCtx, createSdk } from "hydra-ts";
import { FC, ReactNode, useMemo } from "react";
import HydraStakingIdl from "target/idl/hydra_staking.json";

// TODO: Create a frontend build system that supports these addresses being injected correctly
const ADDRESSES = {
  hydraStaking: HydraStakingIdl.metadata.address,
};

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

  const sdk = useMemo(() => {
    if (!wallet || !connection) return;

    ////////////////////////////////////////////
    // EXAMPLE SDK BOOTSTRAP
    ////////////////////////////////////////////

    // Create the SDK context
    const ctx = createCtx(wallet, connection, ADDRESSES);

    // Create the sdk
    const sdk = createSdk(ctx);

    return sdk;
  }, [wallet, connection]);

  const handleDemoClicked = async () => {
    if (!sdk) return;

    // This is a wasm call
    const answer = await sdk.staking.calculatePoolTokensForDeposit(
      100n,
      2000n,
      100_000_000n
    );

    // alert the answer
    alert(answer);
  };
  return (
    <div className="App">
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: 20 }}>
          <WalletMultiButton />
        </div>
        {wallet && (
          <button onClick={handleDemoClicked}>Demonstrate Calculate</button>
        )}
      </div>
    </div>
  );
};
