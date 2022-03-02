import { useMemo, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { makeStyles } from '@mui/styles';
import { Box } from '@mui/material';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
// import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    getLedgerWallet,
    getPhantomWallet,
    // getSolletExtensionWallet,
    // getSolletWallet,
    getSolongWallet,
    getBloctoWallet
} from '@solana/wallet-adapter-wallets';
// import { clusterApiUrl } from '@solana/web3.js';

import { SvgGradient } from "./components/icons";
import Sidebar from "./components/sidebar";
import { WalletButton, WalletModal } from "./components/wallet";
import Swap from "./pages/swap";
import Pools from "./pages/pools";
import Stake from "./pages/stake";
import { RPC } from "./interfaces";

const useStyles = makeStyles({
  walletWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "24px",
    "& .wallet-adapter-button": {
      background: "#25262f",
      borderRadius: "18px",
      height: "36px",
      fontSize: "13px",
      "& svg": {
        width: "24px",
        height: "24px",
        marginRight: "8px",
      },
    },
    "& .wallet-adapter-dropdown-list": {
      "& .wallet-adapter-dropdown-list-item": {
        padding: "0 15px",
        height: "32px",
        fontSize: "13px",
      },
    },
    "@media (max-width:600px)": {
      display: "none",
    },
  },
  contentWrapper: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    margin: "0 24px 20px",
    height: "calc(100vh - 116px)",
    overflow: "auto",
    "@media (max-width:600px)": {
      margin: "20px 10px",
      height: "calc(100vh - 100px)",
      maxHeight: "initial",
    },
  },
});

const networks = [
  {
    name: "MainNet Beta RPC",
    url: "https://api.mainnet-beta.solana.com",
  },
  {
    name: "Serum RPC",
    url: "https://solana-api.projectserum.com",
  },
  {
    name: "TestNet RPC",
    url: "https://api.testnet.solana.com",
  },
  {
    name: "DevNet RPC",
    url: "https://api.devnet.solana.com",
  },
  {
    name: "LocalNet RPC",
    url: "http://localhost:8899",
  },
];

function App() {
  const classes = useStyles();

    // Can be set to 'devnet', 'testnet', or 'mainnet-beta'
    // const network = WalletAdapterNetwork.Devnet;

    // You can also provide a custom RPC endpoint
    // const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking --
    // Only the wallets you configure here will be compiled into your application
    const wallets = useMemo(() => [
        getLedgerWallet(),
        getPhantomWallet(),
        // getSolletExtensionWallet({ network }),
        // getSolletWallet({ network }),
        getSolongWallet(),
        getBloctoWallet()
    ], []);

  const [address, setAddress] = useState("");
  const [currentRPC, setCurrentRPC] = useState<RPC>({
    name: "",
    url: "",
  });
  const [openWalletModal, setOpenWalletModal] = useState(false);

    useEffect(() => {
        setCurrentRPC(networks[4]);
    }, [])

    return (
        <ConnectionProvider endpoint={"http://127.0.0.1:8899"}>
            <WalletProvider wallets={wallets}>
                <div className="layout">
                    <SvgGradient />
                    <Sidebar openWalletModal={() => setOpenWalletModal(true)} address={address} rpc={currentRPC} changeRPC={setCurrentRPC} networks={networks} />
                    <Box component="main" className="container">
                        <Box className={classes.walletWrapper}>
                            <WalletButton openWalletModal={() => setOpenWalletModal(true)} updateAddress={setAddress} />
                        </Box>
                        <Box className={classes.contentWrapper}>
                            <Routes>
                                <Route path="/swap" element={<Swap openWalletConnect={() => setOpenWalletModal(true)} />} />
                                <Route path="/pools" element={<Pools />} />
                                <Route path="/stake" element={<Stake openWalletConnect={() => setOpenWalletModal(true)} />} />
                                <Route path="*" element={<Navigate replace to="/swap" />} />
                            </Routes>
                        </Box>
                    </Box>
                    <WalletModal open={openWalletModal} onClose={() => setOpenWalletModal(false)} address={address} />
                </div>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default App;
