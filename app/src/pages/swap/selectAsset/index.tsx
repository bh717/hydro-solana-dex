import { FC } from "react";
import { makeStyles } from "@mui/styles";
import { Box, Button } from "@mui/material";
import { useWallet } from "@solana/wallet-adapter-react";
import cn from "classnames";

import { CaretDown } from "../../../components/icons";
import { TokenField } from "../hooks/useToken";

const useStyles = makeStyles({
  assetContainer: {
    background: "#424550",
    borderRadius: "6px",
    position: "relative",
    padding: "8px 10px",
    minWidth: "100px",
    "&:hover": {
      "&::before": {
        content: "''",
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        borderRadius: "5px",
        padding: "1px",
        background: "linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)",
        "-webkit-mask":
          "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        "-webkit-mask-composite": "destination-out",
        pointerEvents: "none",
      },
    },
  },
  assetButton: {
    padding: "0 !important",
    width: "100%",
    "& img": {},
    "& span": {
      color: "#FFF",
      fontWeight: "400",
      lineHeight: "24px",
      flexGrow: 1,
      textAlign: "left",
    },
    "& svg": {
      width: "12px",
      height: "8px",
      color: "#FFFFFF73",
    },
    "&:hover": {
      backgroundColor: "transparent !important",
    },
  },
  buttonImgWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    marginRight: "4px",
    "& img": {
      maxWidth: "100%",
      maxHeight: "100%",
    },
  },
  noAsset: {
    background: "linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)",
  },
  disabled: {
    background: "#FFFFFF40 !important",
    color: "#FFFFFF73 !important",
    cursor: "default",
    "&:hover": {
      "&::before": {
        display: "none",
      },
    },
  },
});

interface SelectAssetProps {
  type?: string;
  asset: TokenField;
  changeAsset(): void;
}

const SelectAsset: FC<SelectAssetProps> = ({ type, asset, changeAsset }) => {
  const classes = useStyles();

  const { connected } = useWallet();

  return (
    <Box
      className={cn(classes.assetContainer, {
        [classes.noAsset]: !asset.asset,
        [classes.disabled]: !connected,
      })}
    >
      <Button
        className={classes.assetButton}
        disableRipple={true}
        onClick={changeAsset}
        disabled={!connected}
      >
        {asset.asset ? (
          <>
            <span className={classes.buttonImgWrapper}>
              <img src={asset.asset.logoURI} alt="Asset" />
            </span>
            <span>{asset.asset.symbol}</span>
          </>
        ) : (
          <span>{"Select"}</span>
        )}
        <CaretDown />
      </Button>
    </Box>
  );
};

export default SelectAsset;
