import { WalletProvider as SolanaWalletProvider } from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  SolletExtensionWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import React, { useMemo } from "react";
import { useNetworkProvider } from "./HydraNetworkProvider";
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

export function HydraWalletProvider({
  children,
  wallets: fetchWallets,
}: {
  children: React.ReactNode;
  wallets: (network?: WalletAdapterNetwork) => WalletAdapter[];
}) {
  const networkInfo = useNetworkProvider();
  const network = toWalletAdaptorNetwork(networkInfo.network);
  const wallets = useMemo(() => fetchWallets(network), [network, fetchWallets]);
  return (
    <SolanaWalletProvider wallets={wallets} autoConnect>
      {children}
    </SolanaWalletProvider>
  );
}
