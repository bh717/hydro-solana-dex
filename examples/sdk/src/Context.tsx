import React from "react";
import { HydraClientProvider } from "./components/HydraClientProvider";
import { NetworkProvider } from "./components/NetworkProvider";
import { Wallets } from "./Wallets";

export function Context({ children }: { children: React.ReactNode }) {
  return (
    <NetworkProvider>
      <Wallets>
        <HydraClientProvider>{children}</HydraClientProvider>
      </Wallets>
    </NetworkProvider>
  );
}
