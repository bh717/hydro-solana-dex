import { FC } from "react";
import { makeStyles } from "@mui/styles";
import { Button } from "@mui/material";
import { useWallet } from "hydra-react-ts";
import cn from "classnames";

import HYSD from "../../../assets/images/symbols/hysd.png";
import { CaretDown } from "../../../components/icons";
import { TokenField } from "hydra-react-ts";

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
    backgroundColor: "#424550 !important",
    borderRadius: "6px !important",
    flex: "0 0 120px",
    padding: "8px 10px !important",
    "& span": {
      color: "#FFF",
      fontWeight: "400",
      lineHeight: "24px",
      flexGrow: 1,
      textAlign: "left",
      position: "relative",
    },
    "& svg": {
      width: "12px",
      height: "8px",
      color: "#FFFFFF73",
      position: "relative",
    },
    "&::before": {
      content: "''",
      position: "absolute",
      top: "1px",
      right: "1px",
      bottom: "1px",
      left: "1px",
      background: "#424550",
      borderRadius: "6px",
    },
    "&:hover": {
      background: "linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)",
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
    "&::before": {
      background: "transparent",
    },
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
    <Button
      className={cn(classes.assetButton, {
        [classes.noAsset]: !asset.asset,
      })}
      disableRipple={true}
      onClick={changeAsset}
      disabled={!connected}
    >
      {asset.asset ? (
        <>
          <span className={classes.buttonImgWrapper}>
            <img
              src={
                asset.asset.symbol.includes("HYD") ? HYSD : asset.asset.logoURI
              }
              alt="Asset"
            />
          </span>
          <span>{asset.asset.symbol}</span>
        </>
      ) : (
        <span>{"Select"}</span>
      )}
      <CaretDown />
    </Button>
  );
};

export default SelectAsset;
