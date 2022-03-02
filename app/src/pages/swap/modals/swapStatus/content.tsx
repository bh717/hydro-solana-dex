import React, { FC, useState, useEffect } from "react";
import { makeStyles } from "@mui/styles";
import { Box, Typography, Button } from "@mui/material";
import cn from "classnames";

import { Submitted, Warning } from "../../../../components/icons";

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
}

const Content: FC<ContentProps> = ({ onClose }) => {
  const classes = useStyles();

  const [status, setStatus] = useState("");

  useEffect(() => {
    setStatus("pending");
  }, []);

  return (
    <Box className={classes.statusWrapper}>
      {status === "pending" && (
        <Box className={classes.pendingStatus}>
          <Box className={cn(classes.svgIcon, classes.svgPending)}>
            <Box className={classes.pendingLoader} />
            <span className={classes.loader} />
          </Box>
          <Typography>Waiting For Confirmation</Typography>
          <Typography component="span">
            Swapping 100 USDC for 100 HYSD
          </Typography>
          <Typography component="span">
            Confirm this transaction in your wallet
          </Typography>
        </Box>
      )}
      {status === "submitted" && (
        <Box className={classes.submittedStatus}>
          <Submitted className={cn(classes.svgIcon, classes.svgSubmitted)} />
          <Typography>Transaction Submitted</Typography>
          <Typography component="span">View on Solana Mainnet</Typography>
          <Button className={classes.button} onClick={onClose}>
            Close
          </Button>
        </Box>
      )}
      {status === "rejected" && (
        <Box>
          <Warning className={cn(classes.svgIcon, classes.svgRejected)} />
          <Typography>Transaction Rejected</Typography>
          <Button className={classes.button} onClick={onClose}>
            Dismiss
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Content;
