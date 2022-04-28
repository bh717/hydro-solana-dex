import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  HydraClientProvider,
  HydraNetworkProvider,
  HydraWalletProvider,
} from "hydra-react-ts";
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
  SolongWalletAdapter,
  BloctoWalletAdapter,
  BitKeepWalletAdapter,
  BitpieWalletAdapter,
  CloverWalletAdapter,
  Coin98WalletAdapter,
  CoinhubWalletAdapter,
  MathWalletAdapter,
  // GlowWalletAdapter,
  SafePalWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  TokenPocketWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { ReactNode } from "react";

const getWallets = (network?: WalletAdapterNetwork) => [
  new LedgerWalletAdapter(),
  new PhantomWalletAdapter(),
  new SolletExtensionWalletAdapter({ network }),
  new SolletWalletAdapter({ network }),
  new SolongWalletAdapter(),
  new BloctoWalletAdapter({ network }),
  new BitKeepWalletAdapter(),
  new BitpieWalletAdapter(),
  new CloverWalletAdapter(),
  new Coin98WalletAdapter(),
  new CoinhubWalletAdapter(),
  new MathWalletAdapter(),
  // new GlowWalletAdapter(),
  new SafePalWalletAdapter(),
  new SlopeWalletAdapter(),
  new SolflareWalletAdapter({ network }),
  new TokenPocketWalletAdapter(),
  new TorusWalletAdapter(),
];

export function Providers({ children }: { children: ReactNode }) {
  return (
    <HydraNetworkProvider>
      <HydraWalletProvider wallets={getWallets}>
        <HydraClientProvider>{children}</HydraClientProvider>
      </HydraWalletProvider>
    </HydraNetworkProvider>
  );
}
