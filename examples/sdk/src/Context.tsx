import { WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolletExtensionWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import React, { useMemo } from "react";
import { HydraClientProvider } from "./components/HydraClientProvider";
import { NetworkProvider } from "./components/NetworkProvider";

export function Context({ children }: { children: React.ReactNode }) {
  const endpoint = "http://localhost:8899";

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolletExtensionWalletAdapter()],
    []
  );

  return (
    <NetworkProvider>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <HydraClientProvider>{children}</HydraClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </NetworkProvider>
  );
}
