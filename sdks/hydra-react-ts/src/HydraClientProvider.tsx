import {
  useConnection,
  AnchorWallet,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";
import { HydraSDK } from "hydra-ts";
import React, { useMemo } from "react";
import { useContext } from "react";
import { useNetworkProvider } from "./NetworkProvider";
export const HydraClientContext = React.createContext({} as HydraSDK);

export function HydraClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const { network } = useNetworkProvider();

  const client = useMemo(
    () => HydraSDK.create(network, connection, wallet),
    [connection, network, wallet]
  );

  return (
    <HydraClientContext.Provider value={client}>
      {children}
    </HydraClientContext.Provider>
  );
}

export function useHydraClient() {
  return useContext(HydraClientContext);
}
