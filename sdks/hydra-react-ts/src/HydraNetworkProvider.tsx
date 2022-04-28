import React from "react";
import { ConnectionProvider } from "@solana/wallet-adapter-react";
import Cookies from "js-cookie";
import { Network } from "hydra-ts";

export type NetworkMeta = {
  network: Network;
  endpoint: string;
  name: string;
};

export type NetworkApi = {
  network: Network;
  meta: NetworkMeta;
  setNetwork: (n: Network) => void;
  endpoint: string;
  networks: NetworkMeta[];
};

export type NetworkLookupType = { [n in Network]: NetworkMeta };

// Config
const allowedNetworks = [Network.LOCALNET, Network.DEVNET];

function ensureAllowedNetwork(network?: string) {
  if (!Object.values(Network).includes(network as Network)) {
    throw new Error(`Network ${network} not supported`);
  }
  return network as Network;
}

const defaultNetwork = ensureAllowedNetwork(
  Cookies.get("_hyd_network") ?? allowedNetworks[0]
);

// Map
const NetworkLookup: NetworkLookupType = {
  [Network.LOCALNET]: {
    network: Network.LOCALNET,
    endpoint: "http://localhost:8899",
    name: "Localnet",
  },
  [Network.DEVNET]: {
    network: Network.DEVNET,
    endpoint: "https://api.devnet.solana.com",
    name: "Devnet",
  },
  [Network.MAINNET_BETA]: {
    network: Network.MAINNET_BETA,
    endpoint: "https://api.mainnet-beta.solana.com",
    name: "Mainnet Beta",
  },
  [Network.TESTNET]: {
    network: Network.TESTNET,
    endpoint: "https://api.testnet.solana.com",
    name: "Testnet",
  },
};

// Accessor
function getNetworkMeta(network: Network) {
  return NetworkLookup[network];
}

function createNetworkApi(
  network: Network,
  setNetwork: (n: Network) => void = () => {}
): NetworkApi {
  const meta = getNetworkMeta(network);
  return {
    network,
    meta,
    setNetwork,
    endpoint: meta.endpoint,
    networks: allowedNetworks.map(getNetworkMeta),
  };
}

const defaultApi = createNetworkApi(defaultNetwork);

const NetworkProviderContext = React.createContext<NetworkApi>(defaultApi);

export function HydraNetworkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [network, setNetwork] = React.useState(defaultNetwork);

  const handleNetworkSelected = React.useCallback(
    (newNetwork: Network) => {
      setNetwork(newNetwork);
      Cookies.set("_hyd_network", newNetwork);
    },
    [setNetwork]
  );

  const currentNetwork = React.useMemo(
    () => createNetworkApi(network, handleNetworkSelected),
    [network, handleNetworkSelected]
  );

  return (
    <NetworkProviderContext.Provider value={currentNetwork}>
      <ConnectionProvider endpoint={currentNetwork.meta.endpoint}>
        {children}
      </ConnectionProvider>
    </NetworkProviderContext.Provider>
  );
}

export function useNetworkProvider() {
  return React.useContext(NetworkProviderContext);
}
