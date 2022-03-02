import { makeStyles } from "@mui/styles";
import { Box, Typography, Button } from "@mui/material";

import HYSD from "../../../assets/images/symbols/hysd.png";
import Diamond from "../../../assets/images/stake/diamond.png";

const useStyles = makeStyles({
  statusContainer: {
    background:
      "linear-gradient(180deg, rgba(41, 255, 200, 0.25) 0%, rgba(1, 207, 237, 0) 100%)",
    borderRadius: "6px",
    padding: "2px",
  },
  statusContent: {
    background: "#292c39",
    borderRadius: "4px",
    padding: "30px 38px",
    display: "flex",
    "@media (max-width: 600px)": {
      padding: "30px 22px",
    },
  },
  stakedPart: {
    width: "50%",
    paddingRight: "40px",
    "& > p": {
      color: "#FFFFFFA6",
      fontSize: "14px !important",
      lineHeight: "17px !important",
    },
    "@media (max-width: 600px)": {
      paddingRight: "30px",
    },
  },
  stakedBalance: {
    display: "flex",
    alignItems: "center",
    margin: "8px 0 4px",
    "& > img": {
      width: "24px",
      height: "24px",
      marginRight: "8px",
    },
    "& > span": {
      color: "#FFF",
      fontSize: "32px",
      fontWeight: "500",
      lineHeight: "39px",
    },
  },
  rewardPart: {
    width: "50%",
    paddingLeft: "58px",
    "& > p": {
      color: "#FFFFFFA6",
      fontSize: "14px !important",
      lineHeight: "17px !important",
    },
    "@media (max-width: 600px)": {
      paddingLeft: "30px",
      borderLeft: "1px solid #FFFFFF0A",
    },
  },
  rewardedBalance: {
    position: "relative",
    margin: "8px 0 12px",
    "& > img": {
      position: "absolute",
      width: "46px",
      height: "46px",
      top: "-5px",
      left: "-58px",
      "@media (max-width: 600px)": {
        display: "none",
      },
    },
    "& > span": {
      color: "#FFF",
      fontSize: "32px",
      fontWeight: "500",
      lineHeight: "39px",
    },
  },
  harvestButton: {
    color: "#19CE9D !important",
    lineHeight: "24px !important",
    padding: "8px 24px !important",
    textTransform: "capitalize !important" as any,
    "&::before": {
      content: "''",
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      border: "none",
      borderRadius: "6px",
      padding: "1px",
      background: "linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)",
      "-webkit-mask":
        "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
      "-webkit-mask-composite": "destination-out",
      pointerEvents: "none",
    },
  },
});

const StakeStatus = () => {
  const classes = useStyles();

  return (
    <Box className={classes.statusContainer}>
      <Box className={classes.statusContent}>
        <Box className={classes.stakedPart}>
          <Typography>Your staked HYSD</Typography>
          <Box className={classes.stakedBalance}>
            <img src={HYSD} alt="HYSD" />
            <span>0</span>
          </Box>
          <Typography> ≈ 0 USDC</Typography>
        </Box>
        <Box className={classes.rewardPart}>
          <Typography>Your reward</Typography>
          <Box className={classes.rewardedBalance}>
            <img src={Diamond} alt="Diamond" />
            <span>0</span>
          </Box>
          <Button className={classes.harvestButton}>Harvest</Button>
        </Box>
      </Box>
    </Box>
  );
};

export default StakeStatus;
