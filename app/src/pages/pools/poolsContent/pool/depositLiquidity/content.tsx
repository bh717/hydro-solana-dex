import React, { useState, FC } from "react";
import { makeStyles } from "@mui/styles";
import {
  Box,
  Typography,
  Button,
  IconButton,
  FormControlLabel,
  Switch,
} from "@mui/material";

import HYSD from "../../../../../assets/images/symbols/hysd.png";
import { Plus, Compare, Refresh, Minus } from "../../../../../components/icons";
import NumericField from "../../../../../components/numericField";
import { toFormat } from "../../../../../utils/toFormat";
import { fromFormat } from "../../../../../utils/fromFormat";

const useStyles = makeStyles({
  title: {
    color: "#FFF",
    fontSize: "18px !important",
    fontWeight: "500 !important",
    lineHeight: "22px !important",
    padding: "31px 23px",
  },
  depositWrapper: {
    borderTop: "1px solid #FFFFFF0F",
    color: "#FFFFFFA6",
    display: "flex",
    padding: "4px 7px",
    "@media (max-width: 600px)": {
      flexDirection: "column",
    },
  },
  depositBox: {
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    flex: 1,
    padding: "16px",
    "& > svg": {
      color: "#FFF",
      width: "16px",
      height: "16px",
      marginBottom: "20px",
    },
  },
  depositAmount: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "20px",
    width: "100%",
  },
  amountDetail: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10px",
    "& > p": {
      fontSize: "14px",
      lineHeight: "17px",
      "& span": {
        color: "#FFF",
        fontWeight: "500",
      },
    },
    "& > .MuiButton-root": {
      color: "#FFFFFFA6",
      fontSize: "13px",
      lineHeight: "16px",
      padding: 0,
      minWidth: "initial",
      textTransform: "capitalize",
    },
  },
  amountInputWrapper: {
    position: "relative",
    "& .MuiInputBase-root": {
      background: "#FFFFFF0F",
      borderRadius: "6px",
      padding: "17px 100px 17px 16px",
      width: "100%",
      "& input": {
        color: "#FFFFFFD9",
        fontSize: "18px",
        fontWeight: "500",
        lineHeight: "22px",
        height: "22px",
        padding: 0,
      },
    },
  },
  amountAsset: {
    display: "flex",
    alignItems: "center",
    position: "absolute",
    top: "50%",
    right: "16px",
    transform: "translateY(-50%)",
    "& img": {
      width: "24px",
      height: "24px",
      marginRight: "4px",
    },
    "& p": {
      color: "#FFF",
      fontSize: "14px",
      fontWeight: "500",
      lineHeight: "17px",
    },
  },
  depositItem: {
    display: "flex",
    alignItems: "center",
    marginBottom: "16px",
    width: "100%",
    "& > p": {
      fontSize: "14px",
      lineHeight: "17px",
      "&:last-of-type": {
        color: "#FFF",
      },
    },
    "&:last-of-type": {
      marginBottom: 0,
    },
  },
  itemLine: {
    borderBottom: "1px dashed #FFFFFF40",
    flexGrow: 1,
    margin: "0 10px",
  },
  estimation: {
    color: "#FFF",
    fontSize: "14px",
    fontWeight: "500",
    lineHeight: "17px",
    padding: "16px 0",
    width: "100%",
  },
  marketPrice: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    "& > p": {
      fontSize: "14px",
      fontWeight: "500",
      lineHeight: "17px",
    },
    "& svg": {
      width: "16px",
      height: "16px",
      marginLeft: "6px",
    },
  },
  priceToggleWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "12px",
    marginBottom: "16px",
    width: "100%",
    "& .MuiFormControlLabel-root": {
      marginLeft: "0px",
      marginRight: "0px",
      "& .MuiSwitch-root": {
        width: "28px",
        height: "17px",
        padding: 0,
        marginRight: "6px",
        "& .MuiSwitch-switchBase": {
          color: "#FFF",
          padding: 0,
          top: "1px",
          left: "1px",
          "& .MuiSwitch-thumb": {
            width: "15px",
            height: "15px",
          },
          "&.Mui-checked": {
            transform: "translateX(11px)",
            "-webkit-transform": "translateX(11px)",
            "-moz-transform": "translateX(11px)",
            "-ms-transform": "translateX(11px)",
            "& + .MuiSwitch-track": {
              backgroundColor: "#19CE9D",
            },
          },
        },
        "& .MuiSwitch-track": {
          borderRadius: "8px",
          backgroundColor: "#FFFFFF26",
          opacity: 1,
        },
      },
      "& .MuiTypography-root": {
        color: "#FFF",
        fontSize: "14px",
        fontWeight: "500",
        lineHeight: "17px",
      },
    },
    "& .MuiIconButton-root": {
      backgroundColor: "#FFFFFF0A",
      borderRadius: "6px",
      padding: "6px",
      "& svg": {
        fill: "#FFFFFFA6",
        width: "12px",
        height: "12px",
      },
    },
  },
  priceWrapper: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  rangeWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    "@media (max-width: 850px)": {
      flexDirection: "column",
    },
  },
  rangeBox: {
    border: "1px solid #FFFFFF0F",
    borderRadius: "6px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "8px",
    width: "calc(50% - 6px)",
    "& > p": {
      color: "#FFFFFF73",
      fontSize: "13px",
      lineHeight: "16px",
    },
    "@media (max-width: 850px)": {
      width: "100%",
      marginBottom: "12px",
      "&:last-of-type": {
        marginBottom: 0,
      },
    },
  },
  rangeEdit: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    "& > .MuiIconButton-root": {
      backgroundColor: "#FFFFFF0A",
      borderRadius: "2px",
      padding: "4px",
      "& svg": {
        color: "#FFFFFFA6",
        width: "8px",
        height: "8px",
      },
    },
    "& > p": {
      color: "#FFF",
      fontSize: "16px",
      fontWeight: "500",
      lineHeight: "20px",
    },
  },
  concentratedLiquidity: {
    background: "#FFFFFF0F",
    borderRadius: "6px",
    boxSizing: "border-box",
    padding: "20px 24px",
    width: "100%",
    "& > p": {
      fontSize: "12px",
      "&:first-of-type": {
        color: "#FFF",
        fontWeight: "500",
        lineHeight: "15px",
        marginBottom: "10px",
      },
      "&:last-of-type": {
        lineHeight: "14px",
        "& span": {
          color: "#FFF",
          textDecoration: "underline",
        },
      },
    },
  },
  footer: {
    background: "#FFFFFF0A",
    borderRadius: "0 0 4px 4px",
    color: "#FFFFFFA6",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 23px",
    "@media (max-width: 600px)": {
      background: "transparent",
      flexDirection: "column",
    },
  },
  supportDoubleDip: {
    width: "calc(50% - 42px)",
    "& p": {
      fontSize: "12px",
      lineHeight: "14px",
    },
    "@media (max-width: 600px)": {
      width: "100%",
    },
  },
  supportTitle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10px",
    "& > p": {
      "&:first-of-type": {
        color: "#FFF",
        fontWeight: "500",
      },
      "&:last-of-type": {
        textDecoration: "underline",
      },
    },
  },
  footerButton: {
    background: "linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)",
    color: "#FFF !important",
    flexGrow: 1,
    fontSize: "16px",
    lineHeight: "24px",
    marginLeft: "60px !important",
    padding: "16px !important",
    textTransform: "capitalize",
    "&.Mui-disabled": {
      background: "#FFFFFF40 !important",
      color: "#FFFFFF73 !important",
    },
    "@media (max-width: 600px)": {
      order: "-1",
      marginLeft: "0 !important",
      marginBottom: "24px !important",
      width: "100%",
    },
  },
});

interface ContentProps {
  tokenA: any;
  tokenB: any;
  setFocus(position: "from" | "to"): void;
  isSubmitDisabled: boolean;
  onConfirm(): void;
}

const Content: FC<ContentProps> = ({
  tokenA,
  tokenB,
  setFocus,
  isSubmitDisabled,
  onConfirm,
}) => {
  const classes = useStyles();

  const [priceRange, setPriceRange] = useState(false);

  return (
    <>
      <Typography className={classes.title}>Deposit Liquidity</Typography>
      <Box className={classes.depositWrapper}>
        <Box className={classes.depositBox}>
          <Box className={classes.depositAmount}>
            <Box className={classes.amountDetail}>
              <Typography>
                Balance: <span>201,123,698.8091</span>
              </Typography>
              <Button>Max</Button>
            </Box>
            <Box className={classes.amountInputWrapper}>
              <NumericField
                value={toFormat(tokenA.amount, tokenA.asset?.decimals)}
                onChange={(value: number) => {
                  tokenA.setAmount(fromFormat(value, tokenA.asset?.decimals));
                }}
                onFocus={() => setFocus("from")}
              />
              <Box className={classes.amountAsset}>
                <img
                  src={
                    tokenA.asset?.symbol.includes("HYD")
                      ? HYSD
                      : tokenA.asset?.logoURI
                  }
                  alt="Coin"
                />
                <Typography>{tokenA.asset?.symbol}</Typography>
              </Box>
            </Box>
          </Box>
          <Plus />
          <Box className={classes.depositAmount}>
            <Box className={classes.amountDetail}>
              <Typography>
                Balance: <span>298.8091</span>
              </Typography>
              <Button>Max</Button>
            </Box>
            <Box className={classes.amountInputWrapper}>
              <NumericField
                value={toFormat(tokenB.amount, tokenB.asset?.decimals)}
                onChange={(value: number) => {
                  tokenB.setAmount(fromFormat(value, tokenB.asset?.decimals));
                }}
                onFocus={() => setFocus("to")}
              />
              <Box className={classes.amountAsset}>
                <img
                  src={
                    tokenB.asset?.symbol.includes("HYD")
                      ? HYSD
                      : tokenB.asset?.logoURI
                  }
                  alt="Coin"
                />
                <Typography>{tokenB.asset?.symbol}</Typography>
              </Box>
            </Box>
          </Box>
          <Box className={classes.depositItem}>
            <Typography>Total</Typography>
            <Box className={classes.itemLine} />
            <Typography>$200</Typography>
          </Box>
          <Typography className={classes.estimation}>
            Est. Earn After double-dipping
          </Typography>
          <Box className={classes.depositItem}>
            <Typography>Fee income</Typography>
            <Box className={classes.itemLine} />
            <Typography>$1 / Month</Typography>
          </Box>
          <Box className={classes.depositItem}>
            <Typography>Farm</Typography>
            <Box className={classes.itemLine} />
            <Typography>24% APR</Typography>
          </Box>
        </Box>
        <Box className={classes.depositBox}>
          <Box className={classes.marketPrice}>
            <Typography>Markets Price: 200 USDC per SOL</Typography>
            <Compare />
          </Box>
          <Box className={classes.priceToggleWrapper}>
            <FormControlLabel
              control={
                <Switch
                  checked={priceRange}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setPriceRange(event.target.checked)
                  }
                />
              }
              label="Set Price Range"
            />
            <IconButton>
              <Refresh />
            </IconButton>
          </Box>
          {priceRange ? (
            <Box className={classes.priceWrapper}>
              <Box className={classes.rangeWrapper}>
                <Box className={classes.rangeBox}>
                  <Typography>Min Price</Typography>
                  <Box className={classes.rangeEdit}>
                    <IconButton>
                      <Minus />
                    </IconButton>
                    <Typography>240,123.2901</Typography>
                    <IconButton>
                      <Plus />
                    </IconButton>
                  </Box>
                  <Typography>HYSD per USDC</Typography>
                </Box>
                <Box className={classes.rangeBox}>
                  <Typography>Min Price</Typography>
                  <Box className={classes.rangeEdit}>
                    <IconButton>
                      <Minus />
                    </IconButton>
                    <Typography>240,123.2901</Typography>
                    <IconButton>
                      <Plus />
                    </IconButton>
                  </Box>
                  <Typography>USDC per HYSD</Typography>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box className={classes.concentratedLiquidity}>
              <Typography>Concentrated Liuqidity</Typography>
              <Typography>
                You can establish a centralized position by{" "}
                <span>setting the price range</span>. Full range positions may
                earn less fees than concentrated positions.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
      <Box className={classes.footer}>
        <Box className={classes.supportDoubleDip}>
          <Box className={classes.supportTitle}>
            <Typography>Support Double Dip</Typography>
            <Typography>{"More>"}</Typography>
          </Box>
          <Typography>
            after depositing, pls move to "double-dip" for the project token
            rewards!
          </Typography>
        </Box>
        <Button
          className={classes.footerButton}
          disabled={
            tokenA.amount <= 0 || tokenB.amount <= 0 || isSubmitDisabled
          }
          onClick={onConfirm}
        >
          {tokenA.amount <= 0 || tokenB.amount <= 0
            ? "Enter amounts"
            : "Deposit"}
        </Button>
      </Box>
    </>
  );
};

export default Content;
