import React from "react";
import { HydraClientProvider, NetworkProvider, WalletProvider } from ".";

export function HydraProvider({ children }: { children: React.ReactNode }) {
  return (
    <NetworkProvider>
      <WalletProvider>
        <HydraClientProvider>{children}</HydraClientProvider>
      </WalletProvider>
    </NetworkProvider>
  );
}
