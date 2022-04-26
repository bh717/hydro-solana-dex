import { WalletProvider as SolanaWalletProvider } from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  SolletExtensionWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import React, { useMemo } from "react";
import { useNetworkProvider } from "./NetworkProvider";
import {
  WalletAdapter,
  WalletAdapterNetwork,
} from "@solana/wallet-adapter-base";
import { Network } from "hydra-ts";

function toWalletAdaptorNetwork(
  network: Network
): WalletAdapterNetwork | undefined {
  return (network !== "localnet"
    ? network
    : undefined) as any as WalletAdapterNetwork;
}

function initWallets(
  network: WalletAdapterNetwork | undefined
): WalletAdapter[] {
  return [
    new PhantomWalletAdapter(),
    new SolletExtensionWalletAdapter({ network }),
  ];
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const networkInfo = useNetworkProvider();
  const network = toWalletAdaptorNetwork(networkInfo.network);
  const wallets = useMemo(() => initWallets(network), [network]);
  return (
    <SolanaWalletProvider wallets={wallets} autoConnect>
      {children}
    </SolanaWalletProvider>
  );
}
