import React, { FC } from "react";
import { makeStyles } from "@mui/styles";
import { Box, Button, IconButton, InputBase, Typography } from "@mui/material";
import { useWallet } from "@solana/wallet-adapter-react";
// import cn from "classnames";

import { Exchange, Warning } from "../../../components/icons";
import SelectAsset from "../selectAsset";
import { TokenField } from "../hooks/useToken";
import { Asset, AssetBalance } from "../../../types";
import { toFormat } from "../../../utils/toFormat";
import { fromFormat } from "../../../utils/fromFormat";

const useStyles = makeStyles({
  swapContainer: {
    background: "#2a2d3a",
    borderRadius: "4px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
  },
  assetContainer: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  assetDetail: {
    color: "#FFFFFFD9",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
    "& .MuiTypography-root": {
      lineHeight: "19px",
    },
  },
  assetInput: {
    background: "#373944",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    padding: "8px",
  },
  baseInput: {
    flexGrow: 1,
    padding: "0 8px",
    "& input": {
      color: "#FFF",
      padding: 0,
      fontSize: "16px",
      fontWeight: "500",
    },
  },
  maxButton: {
    color: "#FFFFFFA6",
    cursor: "pointer",
    fontSize: "14px",
    lineHeight: "17px",
    marginRight: "8px",
  },
  exchangeButton: {
    alignSelf: "center",
    background: "#373944 !important",
    borderRadius: "4px !important",
    width: "32px",
    height: "32px",
    margin: "24px 0 !important",
    "& svg": {
      width: "20px",
      height: "20px",
      transform: "rotate(90deg)",
    },
  },
  priceDetail: {
    display: "flex",
    flexDirection: "column",
    marginTop: "24px",
    width: "100%",
  },
  priceStatus: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    color: "#FFFFFFD9 !important",
  },
  statusType: {
    fontSize: "14px !important",
    lineHeight: "17px !important",
  },
  statusInfo: {
    fontSize: "14px !important",
    lineHeight: "17px !important",
    textAlign: "right",
    "& > div": {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      marginBottom: "2px",
      "& > svg": {
        color: "#FFFFFFA6",
        marginLeft: "6px",
        width: "16px",
        height: "17px",
      },
    },
  },
  priceImpact: {
    display: "flex",
    alignItems: "center",
    marginTop: "10px",
  },
  impactTitle: {
    color: "#FFFFFFA6",
    fontSize: "14px !important",
    lineHeight: "17px !important",
    textDecoration: "underline",
  },
  impactLine: {
    flexGrow: "1",
    borderBottom: "1px dashed #FFFFFF40",
    margin: "0 6px 0 20px",
  },
  impactInfo: {
    fontSize: "14px !important",
    lineHeight: "17px !important",
    textAlign: "right",
    width: "60px",
  },
  goodPrice: {
    color: "#19CE9D",
  },
  badPrice: {
    color: "#EFBF13",
  },
  poolStatus: {
    display: "flex",
    alignItems: "center",
    marginTop: "24px",
    width: "100%",
    "& > p": {
      flexGrow: 1,
      fontSize: "14px !important",
      lineHeight: "17px !important",
      padding: "0 6px !important",
    },
  },
  noPool: {
    color: "#F64949",
  },
  swapButton: {
    background:
      "linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%) !important",
    borderRadius: "6px !important",
    color: "#FFF !important",
    fontSize: "16px !important",
    marginTop: "43px !important",
    lineHeight: "24px !important",
    textTransform: "initial !important" as any,
    padding: "16px !important",
    width: "100%",
    "&.Mui-disabled": {
      background: "#FFFFFF40 !important",
      color: "#FFFFFF73 !important",
    },
  },
});

interface SwapAssetProps {
  fromAsset: TokenField;
  toAsset: TokenField;
  changeAsset(type: string): void;
  balances: AssetBalance;
  assetFocus(focus: "from" | "to"): void;
  exchangeAsset(): void;
  canSwap: boolean;
  poolExits: boolean;
  poolPairSelected?: Asset;
  confirmSwap(): void;
  walletConnect(): void;
}

const SwapAsset: FC<SwapAssetProps> = ({
  fromAsset,
  toAsset,
  changeAsset,
  balances,
  assetFocus,
  exchangeAsset,
  canSwap,
  poolExits,
  poolPairSelected,
  confirmSwap,
  walletConnect,
}) => {
  const classes = useStyles();

  const { connected } = useWallet();
  // const [showPriceDetail, setShowPriceDetail] = useState(true);

  // useEffect(() => {
  //   if (fromAmount && toAmount) setShowPriceDetail(true);
  //   else setShowPriceDetail(false);
  // }, [fromAmount, toAmount]);

  const SwapButtonContent = () => {
    if (!fromAsset.asset || !toAsset.asset) return "Select a token";
    return "Approve";
  };

  return (
    <>
      <Box className={classes.swapContainer}>
        <Box className={classes.assetContainer}>
          <Box>
            <Box className={classes.assetDetail}>
              <Typography>From</Typography>
              <Typography>
                Balance:{" "}
                {fromAsset.asset ? balances[fromAsset.asset.address] : ""}
              </Typography>
            </Box>
            <Box className={classes.assetInput}>
              <InputBase
                className={classes.baseInput}
                type="number"
                value={toFormat(fromAsset.amount, fromAsset.asset?.decimals)}
                placeholder="0"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  fromAsset.setAmount(
                    fromFormat(
                      Number(event.target.value),
                      fromAsset.asset?.decimals
                    )
                  )
                }
                onFocus={() => assetFocus("from")}
              />
              <span className={classes.maxButton}>Max</span>
              <SelectAsset
                asset={fromAsset}
                changeAsset={() => changeAsset("From")}
              />
            </Box>
          </Box>
          <IconButton
            className={classes.exchangeButton}
            onClick={exchangeAsset}
          >
            <Exchange />
          </IconButton>
          <Box>
            <Box className={classes.assetDetail}>
              <Typography>To</Typography>
              <Typography>
                Balance: {toAsset.asset ? balances[toAsset.asset.address] : ""}
              </Typography>
            </Box>
            <Box className={classes.assetInput}>
              <InputBase
                className={classes.baseInput}
                type="number"
                value={toFormat(toAsset.amount, toAsset.asset?.decimals)}
                placeholder="0"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  toAsset.setAmount(
                    fromFormat(
                      Number(event.target.value),
                      toAsset.asset?.decimals
                    )
                  )
                }
                onFocus={() => assetFocus("to")}
              />
              <SelectAsset
                asset={toAsset}
                changeAsset={() => changeAsset("To")}
              />
            </Box>
          </Box>
        </Box>
        {!poolExits && poolPairSelected && (
          <Box className={classes.poolStatus}>
            <Warning className={classes.noPool} />
            <Typography className={classes.noPool}>
              There is no pool available for this pair
            </Typography>
          </Box>
        )}
        {/* {showPriceDetail && (
          <Box className={classes.priceDetail}>
            <Box className={classes.priceStatus}>
              <Typography className={cn(classes.statusType, classes.goodPrice)}>
                Great Price
              </Typography>
              <Typography className={classes.statusInfo} component="div">
                <Box>
                  <span>
                    1 {fromAsset.symbol} = 2 {toAsset.symbol}
                  </span>{" "}
                  <Compare />
                </Box>
                <span className={classes.goodPrice}>
                  1.5% Better than market
                </span>
              </Typography>
            </Box>
            <Box className={classes.priceImpact}>
              <Typography className={classes.impactTitle}>
                Price Impact
              </Typography>
              <Box className={classes.impactLine} />
              <Typography className={cn(classes.impactInfo, classes.goodPrice)}>
                {"< 0.01%"}
              </Typography>
            </Box>
          </Box>
        )} */}
        {connected ? (
          <Button
            className={classes.swapButton}
            disabled={
              !fromAsset.asset ||
              !toAsset.asset ||
              fromAsset.amount <= 0 ||
              toAsset.amount <= 0 ||
              !canSwap
            }
            onClick={confirmSwap}
          >
            {SwapButtonContent()}
          </Button>
        ) : (
          <Button className={classes.swapButton} onClick={walletConnect}>
            Connect Wallet
          </Button>
        )}
      </Box>
    </>
  );
};

export default SwapAsset;
