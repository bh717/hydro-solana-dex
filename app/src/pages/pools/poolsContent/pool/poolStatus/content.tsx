import { FC } from "react";
import { makeStyles } from "@mui/styles";
import { Box, Typography, Button } from "@mui/material";
import { StateValue } from "xstate";
import cn from "classnames";

import { Submitted, Warning } from "../../../../../components/icons";
import { Asset } from "../../../../../types";
import { toFormat } from "../../../../../utils/toFormat";

const useStyles = makeStyles({
  statusWrapper: {
    padding: "32px",
    "& > div": {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
  },
  pendingStatus: {
    "& p": {
      marginBottom: "16px",
    },
    "& span": {
      color: "#FFFFFFD9",
      fontSize: "14px !important",
      lineHeight: "17px !important",
      marginBottom: "16px",
    },
  },
  submittedStatus: {
    "& span": {
      backgroundImage:
        "linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)",
      backgroundSize: "100%",
      backgroundRepeat: "repeat",
      "-webkit-background-clip": "text",
      "-webkit-text-fill-color": "transparent",
      "-moz-background-clip": "text",
      "-moz-text-fill-color": "transparent",
      cursor: "pointer",
      textDecoration: "underline",
      position: "relative",
      marginBottom: "27px",
      "&::after": {
        content: "''",
        position: "absolute",
        bottom: "2px",
        left: 0,
        height: "1px",
        width: "100%",
        backgroundImage:
          "linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)",
      },
    },
  },
  svgIcon: {
    width: "88px !important",
    height: "88px !important",
    margin: "42px 0",
    "& + p": {
      color: "#FFFFFFD9",
      fontSize: "18px !important",
      fontWeight: "500 !important",
      lineHeight: "22px !important",
    },
  },
  svgPending: {
    background: "linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)",
    borderRadius: "50%",
    boxSizing: "border-box",
    padding: "8px",
    position: "relative",
    marginBottom: "64px",
  },
  pendingLoader: {
    background: "#313C4E",
    borderRadius: "50%",
    width: "100%",
    height: "100%",
  },
  loader: {
    position: "absolute",
    top: "-1px",
    left: "-1px",
    width: "90px",
    height: "90px",
    border: "10px solid transparent",
    borderBottomColor: "#313C4E",
    borderRadius: "50%",
    display: "inline-block",
    boxSizing: "border-box",
    animation: "$rotate 3s linear infinite",
  },
  svgSubmitted: {
    color: "transparent",
    "& + p": {
      marginBottom: "12px",
    },
  },
  svgRejected: {
    color: "#F74949",
    width: "107px !important",
    height: "93px !important",
    "& + p": {
      marginBottom: "56px",
    },
  },
  button: {
    background: "linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)",
    borderRadius: "6px",
    color: "#FFF !important",
    fontSize: "16px !important",
    fontWeight: "400 !important",
    lineHeight: "24px !important",
    textTransform: "capitalize !important" as any,
    padding: "16px !important",
    width: "100%",
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
  onClose(): void;
  assetA: Asset | undefined;
  assetAAmount: bigint;
  assetB: Asset | undefined;
  assetBAmount: bigint;
  state: StateValue;
  percent: bigint;
  status: string;
}

const Content: FC<ContentProps> = ({
  onClose,
  assetA,
  assetAAmount,
  assetB,
  assetBAmount,
  state,
  percent,
  status,
}) => {
  const classes = useStyles();

  return (
    <Box className={classes.statusWrapper}>
      {state === "process" && (
        <Box className={classes.pendingStatus}>
          <Box className={cn(classes.svgIcon, classes.svgPending)}>
            <Box className={classes.pendingLoader} />
            <span className={classes.loader} />
          </Box>
          <Typography>Waiting For Confirmation</Typography>
          {status === "deposit" ? (
            <Typography component="span">
              Deposit {toFormat(assetAAmount, assetA?.decimals)}{" "}
              {assetA?.symbol} and {toFormat(assetBAmount, assetB?.decimals)}{" "}
              {assetB?.symbol}
            </Typography>
          ) : (
            <Typography component="span">
              Withdraw {Number(percent) / 100}% of Pool - {assetA?.symbol} and{" "}
              {assetB?.symbol}
            </Typography>
          )}
          <Typography component="span">
            Confirm this transaction in your wallet
          </Typography>
        </Box>
      )}
      {state === "done" && (
        <Box className={classes.submittedStatus}>
          <Submitted className={cn(classes.svgIcon, classes.svgSubmitted)} />
          <Typography>Transaction Submitted</Typography>
          <Typography component="span">View on Solana Mainnet</Typography>
          <Button className={classes.button} onClick={onClose} disableRipple>
            Close
          </Button>
        </Box>
      )}
      {state === "error" && (
        <Box>
          <Warning className={cn(classes.svgIcon, classes.svgRejected)} />
          <Typography>Transaction Rejected</Typography>
          <Button className={classes.button} onClick={onClose} disableRipple>
            Dismiss
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Content;
