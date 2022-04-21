import { WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolletExtensionWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import React, { useMemo } from "react";
import { Network, useNetworkProvider } from "./components/NetworkProvider";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

function toWalletAdaptorNetwork(
  network: Network
): WalletAdapterNetwork | undefined {
  return (network !== "localnet"
    ? network
    : undefined) as any as WalletAdapterNetwork;
}

export function Wallets({ children }: { children: React.ReactNode }) {
  const networkInfo = useNetworkProvider();
  const network = toWalletAdaptorNetwork(networkInfo.network);
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolletExtensionWalletAdapter({ network }),
    ],
    [network]
  );
  return (
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>{children}</WalletModalProvider>
    </WalletProvider>
  );
}
