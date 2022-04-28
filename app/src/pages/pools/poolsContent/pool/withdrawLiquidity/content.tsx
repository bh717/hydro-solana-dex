import React, { useState, FC } from "react";
import { makeStyles } from "@mui/styles";
import { Box, Typography, InputBase, Button } from "@mui/material";

import { Asset } from "../../../../../types";

const useStyles = makeStyles({
  title: {
    color: "#FFF",
    fontSize: "18px !important",
    fontWeight: "500 !important",
    lineHeight: "22px !important",
    padding: "31px 23px",
  },
  amountWrapper: {
    display: "flex",
    flexDirection: "column",
    padding: "1px 23px 0",
    marginBottom: "32px",
    "& label, & p": {
      color: "#FFFFFFA6",
      fontSize: "14px",
      lineHeight: "17px",
      marginBottom: "16px",
    },
  },
  inputBase: {
    border: "1px solid #FFFFFF0A",
    borderRadius: "6px",
    marginBottom: "8px",
    "& input": {
      color: "#FFF",
      fontSize: "20px",
      lineHeight: "24px",
      height: "24px",
      padding: "16px",
    },
  },
  amountOptions: {
    display: "flex",
    justifyContent: "space-around",
    "& .MuiButton-root": {
      border: "1px solid #FFFFFFA6",
      borderRadius: "4px",
      color: "#FFFFFFD9",
      flex: 1,
      fontSize: "16px",
      fontWeight: 400,
      lineHeight: "19px",
      padding: "11px",
      marginRight: "12px",
      "&:last-of-type": {
        marginRight: 0,
      },
    },
  },
  resultWrapper: {
    display: "flex",
    flexDirection: "column",
    padding: "0 23px",
    marginBottom: "16px",
    "& > p": {
      color: "#FFF",
      fontSize: "14px",
      lineHeight: "17px",
      marginBottom: "16px",
    },
  },
  resultItem: {
    display: "flex",
    alignItems: "center",
    marginBottom: "16px",
    "& > p": {
      color: "#FFFFFFA6",
      fontSize: "14px",
      fontWeight: "400",
      lineHeight: "17px",
      "&:last-of-type": {
        color: "#FFF",
      },
    },
  },
  itemLine: {
    flexGrow: 1,
    borderBottom: "1px dashed #FFFFFF40",
    margin: "0 6px 0 20px",
  },
  buttonWrapper: {
    margin: "0 23px 35px",
    "& > button": {
      background: "linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)",
      borderRadius: "6px",
      color: "#FFF",
      fontSize: "16px",
      lineHeight: "24px",
      textTransform: "capitalize",
      padding: "16px",
      width: "100%",
    },
  },
});

interface ContentProps {
  tokenA: Asset;
  tokenB: Asset;
}

const Content: FC<ContentProps> = ({ tokenA, tokenB }) => {
  const classes = useStyles();
  const [search, setSearch] = useState("");

  return (
    <>
      <Typography className={classes.title}>Withdraw Liquidity</Typography>
      <Box className={classes.amountWrapper}>
        <label>Amount</label>
        <InputBase
          className={classes.inputBase}
          value={search}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(event.target.value)
          }
        />
        <Typography>0.2033 FTT / USDC LP</Typography>
        <Box className={classes.amountOptions}>
          <Button>25%</Button>
          <Button>50%</Button>
          <Button>75%</Button>
          <Button>100%</Button>
        </Box>
      </Box>
      <Box className={classes.resultWrapper}>
        <Typography>You'll receive</Typography>
        <Box className={classes.resultItem}>
          <Typography>FTF</Typography>
          <Box className={classes.itemLine} />
          <Typography>0.1</Typography>
        </Box>
        <Box className={classes.resultItem}>
          <Typography>USDC</Typography>
          <Box className={classes.itemLine} />
          <Typography>0.1</Typography>
        </Box>
      </Box>
      <Box className={classes.buttonWrapper}>
        <Button>Withdraw</Button>
      </Box>
    </>
  );
};

export default Content;
