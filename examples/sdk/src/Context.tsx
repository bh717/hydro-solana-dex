import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  // SolletWalletAdapter,
  SolletExtensionWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import React, { useMemo } from "react";
import { HydraClientProvider } from "./components/HydraClientProvider";

export function Context({ children }: { children: React.ReactNode }) {
  const endpoint = "http://localhost:8899";

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolletExtensionWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <HydraClientProvider>{children}</HydraClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
