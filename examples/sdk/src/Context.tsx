import React from "react";
import {
  HydraClientProvider,
  HydraNetworkProvider,
  HydraWalletProvider,
  WalletModalProvider,
} from "hydra-react-ts";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  PhantomWalletAdapter,
  SolletExtensionWalletAdapter,
} from "@solana/wallet-adapter-wallets";

const getWallets = (network?: WalletAdapterNetwork) => [
  new PhantomWalletAdapter(),
  new SolletExtensionWalletAdapter({ network }),
];

export function Context({ children }: { children: React.ReactNode }) {
  return (
    <HydraNetworkProvider>
      <HydraWalletProvider wallets={getWallets}>
        <WalletModalProvider>
          <HydraClientProvider>{children}</HydraClientProvider>
        </WalletModalProvider>
      </HydraWalletProvider>
    </HydraNetworkProvider>
  );
}
