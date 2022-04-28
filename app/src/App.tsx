import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { makeStyles } from "@mui/styles";
import { Box } from "@mui/material";
import { SvgGradient } from "./components/icons";
import Sidebar from "./components/sidebar";
import { WalletButton, WalletModal } from "./components/wallet";
import Swap from "./pages/swap";
import Pools from "./pages/pools";
import Stake from "./pages/stake";
import Config from "./config";
import { Providers } from "./Providers";

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

function App() {
  const classes = useStyles();

  const [address, setAddress] = useState("");

  const [openWalletModal, setOpenWalletModal] = useState(false);

  return (
    <Providers>
      <div className="layout">
        <SvgGradient />
        <Sidebar openWalletModal={() => setOpenWalletModal(true)} />
        <Box component="main" className="container">
          <Box className={classes.walletWrapper}>
            <WalletButton
              openWalletModal={() => setOpenWalletModal(true)}
              updateAddress={setAddress}
            />
          </Box>
          <Box className={classes.contentWrapper}>
            <Routes>
              {Config.swap_enabled && (
                <Route
                  path="/swap"
                  element={
                    <Swap openWalletConnect={() => setOpenWalletModal(true)} />
                  }
                />
              )}
              {Config.pools_enabled && (
                <Route path="/pools" element={<Pools />} />
              )}
              {Config.stake_enabled && (
                <Route
                  path="/stake"
                  element={
                    <Stake openWalletConnect={() => setOpenWalletModal(true)} />
                  }
                />
              )}
              <Route path="*" element={<Navigate replace to="/swap" />} />
            </Routes>
          </Box>
        </Box>
        <WalletModal
          open={openWalletModal}
          onClose={() => setOpenWalletModal(false)}
          address={address}
        />
      </div>
    </Providers>
  );
}

export default App;
