import React, { FC, useEffect, useState } from "react";
import { makeStyles } from "@mui/styles";
import { Box, Typography, InputBase, IconButton } from "@mui/material";

import { Asset } from "../../../../types";
import HYSD from "../../../../assets/images/symbols/hysd.png";
// import { normalizeBalance } from "../../../../helpers/normalize";

const useStyles = makeStyles({
  title: {
    color: "#FFF",
    fontSize: "18px !important",
    fontWeight: "500 !important",
    lineHeight: "22px !important",
    padding: "23px 23px",
  },
  inputBase: {
    border: "1px solid #FFFFFF0A",
    borderRadius: "6px",
    margin: "0 23px",
    width: "calc(100% - 46px)",
    "& input": {
      color: "#FFFFFFA6",
      fontSize: "14px",
      lineHeight: "17px",
      height: "17px",
      padding: "20px 16px",
    },
  },
  typography: {
    color: "#FFFFFFA6",
    fontSize: "14px !important",
    lineHeight: "17px !important",
    padding: "16px 23px",
  },
  tokenWrapper: {
    borderTop: "1px solid #FFFFFF0F",
    display: "flex",
    alignItems: "flex-start",
    flexDirection: "column",
    padding: "0 20px",
    margin: "0 3px",
    height: "300px",
    overflowY: "auto",
  },
  iconButton: {
    padding: "16px 0 !important",
    fontSize: "16px !important",
    justifyContent: "flex-start !important",
    textAlign: "left !important" as any,
    width: "100%",
  },
  buttonImgWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "30px",
    height: "30px",
    marginRight: "8px",
    "& img": {
      maxWidth: "100%",
      maxHeight: "100%",
    },
  },
  assetSymbol: {
    color: "#FFFFFFD9",
    flexGrow: 1,
    lineHeight: "19px",
  },
  assetBalance: {
    color: "#FFF",
    fontWeight: "500",
    lineHeight: "20px",
  },
  noTokens: {
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    "& img": {
      width: "60px",
      height: "60px",
      marginBottom: "20px",
    },
    "& p": {
      color: "#FFF !important",
      fontSize: "16px !important",
      fontWeight: "500",
    },
  },
});

interface ContentProps {
  assetList: Array<Asset>;
  setAsset(asset: Asset): void;
}

const Content: FC<ContentProps> = ({ assetList, setAsset }) => {
  const classes = useStyles();
  const [search, setSearch] = useState("");
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);

  useEffect(() => {
    const tempAssets = assetList.filter((asset) =>
      asset.symbol.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredAssets(tempAssets);
  }, [assetList, search]);

  return (
    <>
      <Typography className={classes.title}>Select a token</Typography>
      <InputBase
        className={classes.inputBase}
        value={search}
        placeholder="Search name or paste address"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          setSearch(event.target.value)
        }
      />
      <Typography className={classes.typography}>Token Name</Typography>

      <Box className={classes.tokenWrapper}>
        {filteredAssets.length > 0 &&
          filteredAssets.map((asset, index) => (
            <IconButton
              className={classes.iconButton}
              key={index}
              onClick={() => setAsset(asset)}
              disableRipple
            >
              <span className={classes.buttonImgWrapper}>
                <img
                  src={asset.symbol.includes("HYD") ? HYSD : asset.logoURI}
                  alt="asset.symbol"
                />
              </span>
              <span className={classes.assetSymbol}>{asset.symbol}</span>
              {/* <span className={classes.assetBalance}>
                {normalizeBalance(asset.balance)}
              </span> */}
            </IconButton>
          ))}
      </Box>
    </>
  );
};

export default Content;
