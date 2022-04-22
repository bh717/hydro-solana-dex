import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { HydraSDK, Network } from "hydra-ts";
import React, { useMemo } from "react";
import { useContext } from "react";

export const HydraClientContext = React.createContext({} as HydraSDK);

export function HydraClientProvider(p: { children: React.ReactNode }) {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const client = useMemo(() => {
    console.log("creating new client...");
    return HydraSDK.create(Network.LOCALNET, connection, wallet);
  }, [connection, wallet]);

  return (
    <HydraClientContext.Provider value={client}>
      {p.children}
    </HydraClientContext.Provider>
  );
}

export function useHydraClient() {
  return useContext(HydraClientContext);
}
