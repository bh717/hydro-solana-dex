import { FC, useEffect, useState } from "react";
import { makeStyles } from "@mui/styles";
import { Box, Typography } from "@mui/material";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-toastify";

import { Deposit } from "../../components/icons";
import Banner from "../../assets/images/stake/banner.png";
import Diamond from "../../assets/images/stake/diamond.png";
import StakeUnstake from "./stakeUnstake";
import StakeStatus from "./stakeStatus";

const useStyles = makeStyles({
  stakeContainer: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: "1100px",
  },
  stakeBanner: {
    background: "#FFFFFF05",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    height: "200px",
    width: "100%",
    "@media (max-width: 600px)": {
      flexDirection: "column",
      alignItems: "flex-start",
      padding: "20px 0",
      height: "initial",
    },
  },
  bannerLeft: {
    backgroundImage: `url(${Banner})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "100% 100%",
    flexGrow: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    height: "100%",
    "& > img": {
      width: "140px",
      "&:first-of-type": {
        marginLeft: "50px",
        transform: "rotate(135deg)",
      },
      "@media (max-width: 1350px)": {
        width: "120px",
      },
      "@media (max-width: 1100px)": {
        width: "90px",
      },
      "@media (max-width: 1000px)": {
        display: "none",
      },
    },
    "@media (max-width: 600px)": {
      background: "none",
      display: "block",
    },
  },
  bannerTitle: {
    padding: "0 24px",
    "& p": {
      "&:first-of-type": {
        color: "#19CE9D",
        fontSize: "32px",
        fontWeight: "600 !important",
        lineHeight: "24px",
        marginBottom: "16px",
      },
      "&:last-of-type": {
        color: "#FFF",
      },
    },
    "@media (max-width: 1000px)": {
      padding: "0 48px 0 24px",
    },
    "@media (max-width: 600px)": {
      padding: "0 24px",
      "& p": {
        "&:first-of-type": {
          lineHeight: "39px !important",
        },
      },
    },
  },
  bannerRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0 60px",
    "& svg": {
      width: "32px !important",
      height: "32px !important",
      marginBottom: "11px",
    },
    "& p": {
      lineHeight: "24px !important",
      "&:first-of-type": {
        color: "#FFFFFFA6",
        fontSize: "14px !important",
        marginBottom: "6px !important",
      },
      "&:last-of-type": {
        color: "#FFF",
        fontSize: "32px !important",
        fontWeight: "500 !important",
      },
    },
    "@media (max-width: 1350px)": {
      padding: "0 40px",
      minWidth: "137px",
    },
    "@media (max-width: 1000px)": {
      padding: "0 24px",
    },
    "@media (max-width: 600px)": {
      alignItems: "flex-start",
      marginTop: "24px",
      "& > svg": {
        display: "none",
      },
    },
  },
  stakeContent: {
    display: "flex",
    marginTop: "24px",
    "& > div": {
      height: "100%",
      "&:first-of-type": {
        width: "40%",
      },
      "&:last-of-type": {
        marginLeft: "24px",
        width: "calc(60% - 24px)",
      },
    },
    "@media (max-width: 1100px)": {
      flexDirection: "column",
      "& > div": {
        width: "calc(100% - 4px) !important",
        "&:last-of-type": {
          marginLeft: "0 !important",
          marginTop: "24px",
        },
      },
    },
  },
});

interface StakeProps {
  openWalletConnect(): void;
}

const Stake: FC<StakeProps> = ({ openWalletConnect }) => {
  const classes = useStyles();
  const wallet = useWallet();

  const [userBalance, setUserBalance] = useState(0);
  const [redeemBalance, setRedeemBalance] = useState(0);
  const [staking, setStaking] = useState(false);
  const [unstaking, setUnstaking] = useState(false);

  const stake = async (amount: number) => {};

  const unstake = async (amount: number) => {};

  return (
    <Box className={classes.stakeContainer}>
      <Box className={classes.stakeBanner}>
        <Box className={classes.bannerLeft}>
          <img src={Diamond} alt="Diamond" />
          <Box className={classes.bannerTitle}>
            <Typography>Simply stake tokens to earn.</Typography>
            <Typography>
              Stake your HYSD maximize your yield. No Impermanent Loss.
            </Typography>
          </Box>
          <img src={Diamond} alt="Diamond" />
        </Box>
        <Box className={classes.bannerRight}>
          <Deposit />
          <Typography>Total Staked</Typography>
          <Typography>$12.56 m</Typography>
        </Box>
      </Box>
      <Box className={classes.stakeContent}>
        <StakeUnstake
          walletConnect={openWalletConnect}
          balance={userBalance}
          xBalance={redeemBalance}
          onStake={stake}
          onUnstake={unstake}
          staking={staking}
          unstaking={unstaking}
        />
        <StakeStatus balance={redeemBalance} />
      </Box>
    </Box>
  );
};

export default Stake;
