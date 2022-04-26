import React from "react";
import {
  HydraClientProvider,
  NetworkProvider,
  WalletProvider,
  WalletModalProvider,
} from "hydra-react-ts";

export function Context({ children }: { children: React.ReactNode }) {
  return (
    <NetworkProvider>
      <WalletProvider>
        <WalletModalProvider>
          <HydraClientProvider>{children}</HydraClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </NetworkProvider>
  );
}
