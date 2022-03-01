import React, { FC, useState, useEffect } from "react";
import { makeStyles } from "@mui/styles";
import { Box, Typography, Button, IconButton, Link } from "@mui/material";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletName } from "@solana/wallet-adapter-base";
import cn from "classnames";

import {
  Hydraswap,
  Copy,
  ExternalLink,
  TransactionPending,
  TransactionDone,
} from "../../icons";
import { Transaction } from "../../../interfaces";
import { normalizeAddress } from "../../../helpers/normalize";

const useStyles = makeStyles({
  content: {
    padding: "31px 23px",
  },
  accountContent: {
    padding: "0 !important",
  },
  selectTitle: {
    color: "#FFF",
    fontSize: "18px !important",
    fontWeight: "500 !important",
    lineHeight: "22px !important",
    marginBottom: "4px !important",
  },
  selectSubTitle: {
    color: "#FFF",
    lineHeight: "17px !important",
    opacity: "0.6",
  },
  walletList: {
    display: "flex",
    flexDirection: "column",
    marginTop: "24px",
  },
  walletItem: {
    alignItems: "center !important",
    justifyContent: "flex-start !important",
    backgroundColor: "#394455 !important",
    borderRadius: "6px !important",
    padding: "12px 16px !important",
    marginBottom: "16px !important",
    width: "100%",
    "& > img": {
      width: "32px",
      height: "32px",
      marginRight: "12px",
    },
    "& > p": {
      color: "#FFF",
      lineHeight: "19px !important",
    },
    "&:last-of-type": {
      marginBottom: "0px !important",
    },
  },
  connectTitle: {
    color: "#FFF",
    fontSize: "24px !important",
    fontWeight: "500 !important",
    lineHeight: "29px !important",
    textAlign: "center",
    marginBottom: "5px !important",
  },
  connectSubTitle: {
    color: "#FFF",
    lineHeight: "19px !important",
    textAlign: "center",
    marginBottom: "24px !important",
  },
  connectWrapper: {
    borderTop: "1px solid #FFFFFF0F",
    padding: "0 3px",
  },
  connectContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "100px 0",
    "& > img": {
      width: "72px",
      height: "72px",
    },
    "& > svg": {
      width: "72px",
      height: "69px",
    },
  },
  connectBridge: {
    color: "#FFFFFFD9",
    fontSize: "24px",
    lineHeight: "29px",
    margin: "0 40px",
  },
  installTitle: {
    color: "#FFF",
    fontSize: "24px !important",
    lineHeight: "29px !important",
    textAlign: "center",
    marginBottom: "24px !important",
  },
  installWrapper: {
    borderTop: "1px solid #FFFFFF0F",
    padding: "40px 3px",
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    "& > img": {
      width: "64px",
      height: "64px",
      marginBottom: "32px",
    },
  },
  installButton: {
    background: "linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)",
    borderRadius: "6px !important",
    padding: "12px 56px !important",
    color: "#FFF !important",
    fontSize: "16px !important",
    fontWeight: "400 !important",
    lineHeight: "24px !important",
    marginBottom: "32px !important",
  },
  installGuide: {
    color: "#FFF",
    fontSize: "14px !important",
    lineHeight: "17px !important",
    textAlign: "center",
    maxWidth: "320px",
  },
  contentFooter: {
    display: "flex",
    justifyContent: "center",
    "& > span": {
      color: "#FFFFFF73",
      fontSize: "14px",
      lineHeight: "17px",
      "&:last-of-type": {
        color: "#FFFFFFA6",
        cursor: "pointer",
        marginLeft: "6px",
      },
    },
  },
  accountContainer: {
    padding: "31px 23px",
  },
  accountTitle: {
    color: "#FFF",
    fontSize: "24px !important",
    fontWeight: "500 !important",
    lineHeight: "29px !important",
    marginBottom: "5px !important",
    textAlign: "center",
  },
  accountSubTitle: {
    color: "#FFFFFFA6",
    lineHeight: "19px !important",
    textAlign: "center",
    marginBottom: "24px !important",
  },
  accountWrapper: {
    borderTop: "1px solid #FFFFFF0F",
    padding: "32px 3px 0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  accountAvatar: {
    background: "linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)",
    borderRadius: "50%",
    width: "56px",
    height: "56px",
    marginBottom: "16px",
  },
  accountAddress: {
    color: "#FFF",
    fontSize: "24px !important",
    lineHeight: "29px !important",
  },
  accountLinks: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: "20px",
    width: "100%",
    "& .MuiLink-root": {
      color: "#FFFFFFA6",
      display: "flex",
      alignItems: "center",
      textDecoration: "none",
      "& > span": {
        fontSize: "14px",
        lineHeight: "17px",
        marginRight: "6px",
      },
      "& > svg": {
        background: "#3f495a",
        borderRadius: "50%",
        padding: "4.5px",
        width: "15px",
        height: "15px",
      },
    },
  },
  accountActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "20px",
    width: "100%",
    "& .MuiButton-root": {
      color: "#19CE9D",
      padding: "12px 0 !important",
      fontSize: "16px !important",
      lineHeight: "24px !important",
      textTransform: "capitalize",
      width: "calc(50% - 8px)",
      "&::before": {
        content: "''",
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        borderRadius: "6px",
        padding: "1px",
        background: "linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)",
        "-webkit-mask":
          "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        "-webkit-mask-composite": "destination-out",
        pointerEvents: "none",
      },
    },
  },
  transactionWrapper: {
    background: "#394455",
    borderRadius: "6px",
    padding: "24px",
  },
  transactionLoading: {
    color: "#FFFFFFD9",
    fontSize: "14px !important",
    lineHeight: "17px !important",
  },
  transactionItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
    "& > .MuiLink-root": {
      color: "#17A27C",
      textDecoration: "none",
    },
    "& > p": {
      color: "#FFFFFFD9",
      fontSize: "13px !important",
      lineHeight: "16px !important",
    },
    "& > svg": {
      color: "#17A27C",
      width: "16px !important",
      height: "16px !important",
    },
    "&:last-of-type": {
      marginBottom: 0,
    },
  },
  svgPending: {
    animation: "$rotate 2s infinite linear",
  },
  "@keyframes rotate": {
    from: {
      transform: "rotate(0deg)",
    },
    to: {
      transform: "rotate(359deg)",
    },
  },
});

interface ContentProps {
  address: string;
}

const Content: FC<ContentProps> = ({ address }) => {
  const classes = useStyles();

  const { wallets, select, wallet, connected } = useWallet();
  const [status, setStatus] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (wallet && !connected) {
      const adapter = wallet.adapter;

      adapter.ready().then((result) => {
        if (result) {
          setStatus("connecting");
          adapter.connect().catch((error) => {
            console.log(error);
          });
        } else {
          setStatus("install");
        }
      });
    }

    if (connected) {
      setStatus("connected");

      const tempTransactions = [
        {
          title: "Swap exactly 2 HYSD for 20.9120 SOL",
          status: "pending",
        },
        {
          title: "Approve HYSD",
          status: "pending",
        },
        {
          title: "Remove 2.9120 HYSD 20.9120 SOL",
          status: "done",
        },
      ];
      setTransactions(tempTransactions);
    }
  }, [wallet, connected]);

  const handleWalletInstall = () => {
    if (wallet && window) {
      window.open(wallet.url, "_blank");
    }
  };

  const resetStatus = () => {
    select("" as WalletName);
    setStatus("");
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
  };

  const clearTransactions = () => {
    setTransactions([]);
  };

  const disconnectWallet = () => {
    if (wallet) {
      const adapter = wallet.adapter;

      adapter
        .disconnect()
        .then(() => {
          setStatus("");
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };

  const changeWallet = () => {
    setStatus("");
  };

  return (
    <Box
      className={cn(classes.content, {
        [classes.accountContent]: wallet && status === "connected",
      })}
    >
      {status === "" && (
        <>
          <Typography className={classes.selectTitle}>
            Select a Wallet
          </Typography>
          <Typography className={classes.selectSubTitle}>
            Please select a wallet to connect to this dapp:
          </Typography>
          <Box className={classes.walletList}>
            {wallets.map((wallet, index) => (
              <IconButton
                className={classes.walletItem}
                key={index}
                onClick={() => select(wallet.name)}
              >
                <img src={wallet.icon} alt="Wallet" />
                <Typography>{wallet.name}</Typography>
              </IconButton>
            ))}
          </Box>
        </>
      )}
      {wallet && status === "connecting" && (
        <>
          <Typography className={classes.connectTitle}>Connecting</Typography>
          <Typography className={classes.connectSubTitle}>
            Please unlock your {wallet.name} wallet
          </Typography>
          <Box className={classes.connectWrapper}>
            <Box className={classes.connectContent}>
              <img src={wallet.icon} alt="Wallet" />
              <span className={classes.connectBridge}>......</span>
              <Hydraswap />
            </Box>
          </Box>
          <Box className={classes.contentFooter}>
            <span>Having trouble?</span>{" "}
            <span onClick={() => resetStatus()}>Go back</span>
          </Box>
        </>
      )}
      {wallet && status === "install" && (
        <>
          <Typography className={classes.installTitle}>
            Wallet is not installed
          </Typography>
          <Box className={classes.installWrapper}>
            <img src={wallet.icon} alt="Wallet" />
            <Button
              className={classes.installButton}
              onClick={handleWalletInstall}
            >
              Install
            </Button>
            <Typography className={classes.installGuide}>
              Make sure you only install their wallet from the{" "}
              {wallet.url.includes("chrome.google.com")
                ? "Google Chrome Web Store"
                : `official ${wallet.url} website`}
              .
            </Typography>
          </Box>
          <Box className={classes.contentFooter}>
            <span>Having trouble?</span>{" "}
            <span onClick={() => resetStatus()}>Go back</span>
          </Box>
        </>
      )}
      {wallet && status === "connected" && (
        <>
          <Box className={classes.accountContainer}>
            <Typography className={classes.accountTitle}>Account</Typography>
            <Typography className={classes.accountSubTitle}>
              Connected with Phantom
            </Typography>
            <Box className={classes.accountWrapper}>
              <span className={classes.accountAvatar} />
              <Typography className={classes.accountAddress}>
                {normalizeAddress(address)}
              </Typography>
              <Box className={classes.accountLinks}>
                <Link component="button" onClick={copyAddress}>
                  <span>Copy Address</span> <Copy />
                </Link>
                <Link href={`https://solscan.io/${address}`} target="_blank">
                  <span>View on explorer</span> <ExternalLink />
                </Link>
              </Box>
              <Box className={classes.accountActions}>
                <Button onClick={disconnectWallet}>Disconnect</Button>
                <Button onClick={changeWallet}>Change wallet</Button>
              </Box>
            </Box>
          </Box>
          <Box className={classes.transactionWrapper}>
            {transactions.length === 0 && (
              <Typography className={classes.transactionLoading}>
                Your transactions will appear here...
              </Typography>
            )}
            {transactions.length > 0 && (
              <>
                <Box className={classes.transactionItem}>
                  <Typography>Recent Transactions</Typography>
                  <Link component="button" onClick={clearTransactions}>
                    clear all
                  </Link>
                </Box>
                {transactions.map((transaction, index) => (
                  <Box className={classes.transactionItem} key={index}>
                    <Typography>{transaction.title}</Typography>
                    {transaction.status === "pending" && (
                      <TransactionPending className={classes.svgPending} />
                    )}
                    {transaction.status === "done" && <TransactionDone />}
                  </Box>
                ))}
              </>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default Content;
