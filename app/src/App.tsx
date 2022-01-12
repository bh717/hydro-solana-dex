import { useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { makeStyles } from '@mui/styles';
import { Box } from '@mui/material';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  getLedgerWallet,
  getPhantomWallet,
  getSlopeWallet,
  getSolflareWallet,
  getSolletExtensionWallet,
  getSolletWallet,
  getTorusWallet,
} from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { Toaster } from 'react-hot-toast';

import Sidebar from './components/sidebar';
import Swap from './pages/swap';
// import { Wallet } from './components/icons';

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

const useStyles = makeStyles({
  walletWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '24px',
    '& .wallet-adapter-button': {
      background: '#25262f',
      borderRadius: '18px',
      height: '36px',
      fontSize: '13px',
      '& svg': {
        width: '24px',
        height: '24px',
        marginRight: '8px'
      }
    },
    '& .wallet-adapter-dropdown-list': {
      '& .wallet-adapter-dropdown-list-item': {
        padding: '0 15px',
        height: '32px',
        fontSize: '13px'
      }
    },
    '@media (max-width:600px)': {
      order: 1,
      justifyContent: 'center',
      '& .wallet-adapter-dropdown-list': {
        top: 0,
        right: '50%',
        transform: 'translate(50%, -146px)',
        transition: 'opacity 200ms ease, visibility 200ms'
      }
    }
  },
  contentWrapper: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    margin: '0 10px 20px',
    height: 'calc(100vh - 104px)',
    overflow: 'auto',
    '@media (max-width:600px)': {
      margin: '20px 10px 0',
      height: 'calc(100vh - 164px)',
      maxHeight: 'initial'
    }
  }
})

function App() {
  const classes = useStyles();

  // Can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking --
  // Only the wallets you configure here will be compiled into your application
  const wallets = useMemo(() => [
    getPhantomWallet(),
    getSlopeWallet(),
    getSolflareWallet(),
    getTorusWallet(),
    getLedgerWallet(),
    getSolletWallet({ network }),
    getSolletExtensionWallet({ network }),
  ], [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="layout">
            <Toaster position="bottom-right" />
            <Sidebar />
            <Box component="main" className="container">
              <Box className={classes.walletWrapper}>
                <WalletMultiButton />
              </Box>
              <Box className={classes.contentWrapper}>
                <Routes>
                  <Route path="/swap" element={<Swap />} />
                  <Route path="*" element={<Navigate replace to="/swap" />} />
                </Routes>
              </Box>
            </Box>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
