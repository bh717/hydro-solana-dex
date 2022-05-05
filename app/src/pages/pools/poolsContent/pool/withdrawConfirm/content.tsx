import { FC } from "react";
import { makeStyles } from "@mui/styles";
import { Box, Typography, Button } from "@mui/material";

import HYSD from "../../../../../assets/images/symbols/hysd.png";
import { Exchange } from "../../../../../components/icons";
import { Asset } from "../../../../../types";

const useStyles = makeStyles({
  title: {
    borderBottom: "1px solid #FFFFFF0F",
    color: "#FFFFFFD9",
    fontSize: "18px !important",
    fontWeight: "500 !important",
    lineHeight: "22px !important",
    padding: "23px 23px",
  },
  assetsWrapper: {
    display: "flex",
    justifyContent: "center",
    padding: "24px 31px",
  },
  assetRow: {
    display: "flex",
    alignItems: "center",
    "& > p": {
      color: "#FFF !important",
      fontSize: "20px !important",
      lineHeight: "24px !important",
      "&:first-of-type": {
        flexGrow: 1,
        padding: "0 10px",
      },
    },
  },
  assetImgWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    "& img": {
      maxWidth: "100%",
      maxHeight: "100%",
    },
  },
  svgExchange: {
    color: "#FFFFFFD9",
    margin: "20px 20px 20px 10px",
    width: "16px !important",
    height: "16px !important",
  },
  priceUpdate: {
    display: "flex",
    alignItems: "center",
    marginTop: "24px",
    "& > p": {
      flexGrow: 1,
      fontSize: "14px !important",
      lineHeight: "17px !important",
      padding: "0 6px !important",
    },
  },
  acceptButton: {
    background: "linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)",
    borderRadius: "6px !important",
    color: "#FFF !important",
    fontSize: "14px !important",
    fontWeight: "500 !important",
    lineHeight: "24px !important",
    padding: "4px 16px !important",
    textTransform: "initial !important" as any,
  },
  priceDetail: {
    background: "#394455",
    color: "#FFFFFFA6",
    padding: "24px 31px",
  },
  detailTitle: {
    fontSize: "14px !important",
    lineHeight: "17px !important",
    marginBottom: "20px !important",
  },
  detailRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: "12px",
    "& p, & span": {
      fontSize: "14px !important",
      lineHeight: "17px !important",
    },
    "&:first-of-type": {
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    "&:last-of-type": {
      marginBottom: 0,
    },
  },
  rowLine: {
    flexGrow: "1",
    borderBottom: "1px dashed #FFFFFF40",
    margin: "0 10px",
  },
  detailInfo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: "2px",
    "& > svg": {
      width: "16px !important",
      height: "16px !important",
      marginRight: "6px",
    },
    "& > span": {
      color: "#FFFFFFD9",
    },
  },
  detailFee: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    "& span": {
      "&:first-of-type": {
        color: "#FFFFFFD9",
        marginBottom: "2px",
      },
      "&:last-of-type": {
        color: "#FFFFFF73",
      },
    },
  },
  goodPrice: {
    color: "#19CE9D",
  },
  badPrice: {
    color: "#EFBF13",
  },
  underLine: {
    textDecoration: "underline",
  },
  confirmButton: {
    background: "linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)",
    borderRadius: "6px !important",
    color: "#FFF !important",
    fontSize: "16px !important",
    fontWeight: "500 !important",
    lineHeight: "24px !important",
    padding: "16px !important",
    textTransform: "initial !important" as any,
    margin: "24px 23px 23px !important",
    width: "calc(100% - 46px)",
    "&.Mui-disabled": {
      background: "#FFFFFF40 !important",
      color: "#FFFFFF73 !important",
    },
  },
});

interface ContentProps {
  assetA: Asset;
  assetB: Asset;
  percent: bigint;
  onApprove(): void;
}

const Content: FC<ContentProps> = ({ assetA, assetB, percent, onApprove }) => {
  const classes = useStyles();

  return (
    <>
      <Typography className={classes.title}>Confirm Withdraw</Typography>
      <Box className={classes.assetsWrapper}>
        <Box className={classes.assetRow}>
          <span className={classes.assetImgWrapper}>
            <img
              src={assetA?.name.includes("HYD") ? HYSD : assetA?.logoURI}
              alt="Asset"
            />
          </span>
          <Typography>{assetA?.symbol}</Typography>
        </Box>
        <Exchange className={classes.svgExchange} />
        <Box className={classes.assetRow}>
          <span className={classes.assetImgWrapper}>
            <img
              src={assetB?.name.includes("HYD") ? HYSD : assetB?.logoURI}
              alt="Asset"
            />
          </span>
          <Typography>{assetB?.symbol}</Typography>
        </Box>
      </Box>
      <Button className={classes.confirmButton} onClick={onApprove}>
        Withdraw {Number(percent) / 100}%
      </Button>
    </>
  );
};

export default Content;
