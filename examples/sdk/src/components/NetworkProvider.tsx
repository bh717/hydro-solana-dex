import React from "react";
import { ConnectionProvider } from "@solana/wallet-adapter-react";

export enum Network {
  LOCALNET = "localnet",
  DEVNET = "devnet",
  MAINNET = "mainnet",
}

export type NetworkMeta = {
  network: Network;
  endpoint: string;
  name: string;
};

export type NetworkApi = {
  network: Network;
  meta: NetworkMeta;
  setNetwork: (n: Network) => void;
  networks: NetworkMeta[];
};

export type NetworkLookupType = { [n in Network]: NetworkMeta };

// Config
const allowedNetworks = [Network.LOCALNET, Network.DEVNET];
const defaultNetwork = allowedNetworks[0];

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
  [Network.MAINNET]: {
    network: Network.MAINNET,
    endpoint: "https://api.mainnet-beta.solana.com",
    name: "Mainnet Beta",
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
  return {
    network,
    meta: getNetworkMeta(network),
    setNetwork,
    networks: allowedNetworks.map(getNetworkMeta),
  };
}

const defaultApi = createNetworkApi(defaultNetwork);

const NetworkProviderContext = React.createContext<NetworkApi>(defaultApi);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetwork] = React.useState(defaultNetwork);

  const currentNetwork = React.useMemo(
    () => createNetworkApi(network, setNetwork),
    [network, setNetwork]
  );
  console.log(currentNetwork);
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
