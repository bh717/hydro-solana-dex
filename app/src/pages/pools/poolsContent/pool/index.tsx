import { FC, useState } from "react";
import { makeStyles } from "@mui/styles";
import { Box, Button, IconButton, Typography, Tooltip } from "@mui/material";
import cn from "classnames";

import { View, List, ChevronRight } from "../../../../components/icons";
import HYSD from "../../../../assets/images/symbols/hysd.png";
import USDC from "../../../../assets/images/symbols/usdc.png";
import DepositLiquidityModal from "./depositLiquidity";
import WithdrawLiquidityModal from "./withdrawLiquidity";

const useStyles = makeStyles({
  poolContainer: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    marginTop: "17px",
  },
  badgeContainer: {
    display: "flex",
    position: "absolute",
    top: "-15px",
    "@media (max-width: 600px)": {
      flexDirection: "column",
    },
  },
  badge: {
    background: "#19CE9D1A",
    backdropFilter: "blur(20px)",
    borderRadius: "4px",
    color: "#19CE9D",
    display: "inline-block",
    fontSize: "13px",
    fontWeight: "500",
    lineHeight: "16px",
    padding: "6px 10px",
    position: "relative",
    marginRight: "6px",
  },
  doubleBadge: {
    "&::before": {
      content: "''",
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      borderRadius: "4px",
      padding: "1px",
      background: "linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)",
      "-webkit-mask":
        "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
      "-webkit-mask-composite": "destination-out",
      pointerEvents: "none",
    },
    "@media (max-width: 600px)": {
      marginBottom: "8px",
    },
  },
  poolWrapper: {
    background: "#FFFFFF0A",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    flexGrow: 1,
    flexWrap: "wrap",
    padding: "12px 0 12px 24px",
    marginBottom: "20px",
    "& > div": {
      padding: "12px 24px 12px 0",
      "&:first-of-type": {
        paddingLeft: 0,
      },
    },
    "&.alignTop": {
      alignItems: "flex-start",
    },
    "@media (max-width: 600px)": {
      flexDirection: "column",
      alignItems: "flex-start",
      padding: "12px 0 12px 16px",
      "&.hasDoubleDip": {
        paddingTop: "48px",
      },
      "& > div": {
        padding: "12px 16px 12px 0",
        "&:first-of-type": {
          paddingLeft: "16px",
        },
      },
    },
  },
  poolContent: {
    display: "flex",
    flexDirection: "column",
    "@media (max-width: 600px)": {
      width: "calc(100% - 16px)",
      "& > div:first-of-type": {
        paddingBottom: "12px",
        width: "100% !important",
      },
    },
  },
  poolDetail: {
    display: "flex",
    flexWrap: "wrap",
    marginTop: "16px",
    "@media (max-width: 600px)": {
      flexDirection: "column",
    },
  },
  liquidityDetail: {
    display: "flex",
    flexDirection: "column",
    width: "400px",
    "& > p": {
      color: "#FFFFFFA6",
      fontSize: "14px",
      lineHeight: "17px",
      "& span": {
        color: "#FFF",
      },
      "&:first-of-type": {
        marginBottom: "12px",
      },
    },
    "@media (max-width: 600px)": {
      width: "100%",
      margin: "12px 0",
      "& > p": {
        "&:first-of-type": {
          marginBottom: "24px !important",
        },
      },
    },
  },
  rangeStatus: {
    display: "flex",
    alignItems: "center",
    "& > p": {
      color: "#FFF",
      fontSize: "14px",
      lineHeight: "17px",
      "& span": {
        cursor: "pointer",
        color: "#FFFFFFA6",
        textDecoration: "underline",
      },
    },
    "& > svg": {
      width: "14px",
      height: "8px",
      color: "#FFFFFFA6",
      margin: "0 8px",
    },
    "@media (max-width: 600px)": {
      flexDirection: "column",
      alignItems: "flex-start",
      "& > svg": {
        transform: "rotate(90deg)",
        margin: "10px 5px",
      },
    },
  },
  assetsContainer: {
    display: "flex",
    alignItems: "center",
    "& span": {
      color: "#FFF",
      fontSize: "20px",
      lineHeight: "24px",
      margin: "0 3px 0 12px",
    },
    "& p": {
      color: "#FFFFFFA6",
      fontSize: "13px",
      lineHeight: "16px",
      margin: "4px 3px 0 12px",
    },
    "& svg": {
      fill: "#FFFFFF73",
      width: "20px",
      height: "20px",
    },
    "@media (max-width: 600px)": {
      borderBottom: "1px solid #FFFFFF0A",
      marginBottom: "12px",
      width: "calc(100% - 32px) !important",
    },
  },
  assetsLogo: {
    width: "51px",
    height: "32px",
    position: "relative",
    "& img": {
      position: "absolute",
      width: "32px",
      height: "32px",
      "&:last-of-type": {
        right: 0,
      },
    },
  },
  emptyLogo: {
    background: "#FFFFFF0F",
    borderRadius: "50%",
    position: "absolute",
    width: "32px",
    height: "32px",
  },
  poolTerms: {
    display: "flex",
    "@media (max-width: 1045px)": {
      order: "-1",
      marginBottom: "12px",
    },
    "@media (max-width: 600px)": {
      flexDirection: "column",
      borderBottom: "1px solid #FFFFFF0A",
      "& > .MuiBox-root": {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "24px",
        width: "100% !important",
        "& > p:first-of-type": {
          marginRight: "0 !important",
          marginBottom: "0 !important",
        },
      },
    },
  },
  itemLabel: {
    display: "flex",
    alignItems: "center",
    marginBottom: "8px !important",
    marginRight: "8px !important",
    "& span": {
      color: "#FFFFFFA6",
      fontSize: "14px",
      lineHeight: "16px",
    },
    "& svg": {
      fill: "#FFFFFFD9",
      width: "16px",
      height: "16px",
      marginLeft: "2px",
    },
  },
  underline: {
    textDecoration: "underline",
  },
  pointer: {
    cursor: "pointer",
  },
  itemContent: {
    color: "#FFF",
    fontSize: "16px",
    lineHeight: "20px",
    marginRight: "8px !important",
    "@media (max-width: 600px)": {
      fontSize: "18px",
      fontWeight: "500",
      lineHeight: "22px",
    },
  },
  poolButtons: {
    display: "flex",
    justifyContent: "flex-end",
    flexGrow: 1,
    "& .MuiButton-root": {
      borderRadius: "6px",
      padding: "8px 25px",
      lineHeight: "24px",
      textTransform: "capitalize !important" as any,
      "&.Mui-disabled": {
        background: "#FFFFFF40",
        color: "#FFFFFF73 !important",
        "&::before": {
          display: "none",
        },
      },
    },
    "@media (max-width: 600px)": {
      width: "calc(100% - 16px)",
      "& .MuiButton-root": {
        flexGrow: 1,
      },
    },
  },
  poolButton: {
    background: "linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)",
    color: "#FFF !important",
  },
  borderButton: {
    color: "#19CE9D !important",
    "&::before": {
      content: "''",
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      borderRadius: "6px",
      padding: "1px",
      background: "linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)",
      "-webkit-mask":
        "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
      "-webkit-mask-composite": "destination-out",
      pointerEvents: "none",
    },
  },
  rangeHint: {
    background: "#FFFFFF0A",
    backdropFilter: "blur(20px)",
    borderRadius: "4px",
    padding: "4px 6px",
    position: "relative",
    marginTop: "12px",
    height: "23px",
    width: "max-content",
    "& span": {
      color: "#FFFFFFD9",
      display: "inline-block",
      fontSize: "13px",
      lineHeight: "15px",
      position: "relative",
      paddingLeft: "10px",
      "&::before": {
        content: "''",
        position: "absolute",
        left: 0,
        top: "4.5px",
        width: "6px",
        height: "6px",
        borderRadius: "50%",
      },
    },
    "&.goodRange": {
      "& span::before": {
        background: "#19CE9D",
      },
    },
    "&.badRange": {
      "& span::before": {
        background: "#F74949",
      },
    },
  },
  doubleDipHint: {
    borderTop: "1px solid #FFFFFF0A",
    marginTop: "4px",
    marginRight: "24px",
    paddingTop: "16px !important",
    width: "100%",
    "& > p": {
      color: "#FFFFFFA6",
      fontSize: "12px",
      lineHeight: "18px",
      "& span": {
        color: "#FFF",
        textDecoration: "underline",
      },
    },
    "@media (max-width: 600px)": {
      marginRight: "16px",
      width: "calc(100% - 32px)",
    },
  },
});

interface PoolProps {
  type?: string;
  isDoubleDip?: boolean;
  hasWithdraw?: boolean;
  isDisable?: boolean;
  hasUndip?: boolean;
  inRange?: boolean;
}

const Pool: FC<PoolProps> = ({
  type,
  isDoubleDip,
  hasWithdraw,
  isDisable,
  hasUndip,
  inRange,
}) => {
  const classes = useStyles();

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  return (
    <Box className={classes.poolContainer}>
      <Box className={classes.badgeContainer}>
        {isDoubleDip && (
          <span className={cn(classes.badge, classes.doubleBadge)}>
            Support Double Dip
          </span>
        )}
        <span className={classes.badge}>10 HYSD per day for each $1000</span>
      </Box>
      <Box
        className={cn(classes.poolWrapper, {
          hasDoubleDip: isDoubleDip,
          alignTop: type === "liquidity",
        })}
      >
        {type === "all" && (
          <>
            <Box className={classes.assetsContainer} style={{ width: "215px" }}>
              <Box className={classes.assetsLogo}>
                <img src={HYSD} alt="Coin" />
                <img src={USDC} alt="Coin" />
              </Box>
              <Typography variant="caption">SOL-USDC</Typography>
              <IconButton>
                <View />
              </IconButton>
            </Box>
            <Box style={{ width: "70px" }}>
              <Typography className={classes.itemLabel}>
                <span>APR</span> <List />
              </Typography>
              <Typography className={classes.itemContent}>46.72%</Typography>
            </Box>
            <Box style={{ width: "190px" }}>
              <Typography className={classes.itemLabel}>
                <span>Total Liquidity</span>
              </Typography>
              <Typography className={classes.itemContent}>
                $ 476,369,789,123.0789
              </Typography>
            </Box>
            <Box style={{ width: "190px" }}>
              <Typography className={classes.itemLabel}>
                <span>24H Volumn</span>
              </Typography>
              <Typography className={classes.itemContent}>
                520,369,789,123.0789
              </Typography>
            </Box>
            <Box className={classes.poolButtons}>
              <Button
                className={classes.poolButton}
                onClick={() => setShowDepositModal(true)}
              >
                Deposit
              </Button>
              {hasWithdraw && (
                <Button
                  className={classes.borderButton}
                  onClick={() => setShowWithdrawModal(true)}
                  style={{ marginLeft: "12px" }}
                >
                  Withdraw
                </Button>
              )}
            </Box>
          </>
        )}
        {type === "liquidity" && (
          <>
            <Box className={classes.poolContent}>
              <Box className={classes.assetsContainer}>
                <Box className={classes.assetsLogo}>
                  <img src={HYSD} alt="Coin" />
                  <img src={USDC} alt="Coin" />
                </Box>
                <Typography variant="caption">SOL-USDC</Typography>
                <IconButton>
                  <View />
                </IconButton>
              </Box>
              <Box className={classes.poolDetail}>
                <Box className={classes.liquidityDetail}>
                  <Typography>
                    Your Liquidity: <span>476 LP Token</span> ≈ $100
                  </Typography>
                  {inRange === undefined ? (
                    <Typography>
                      You did not set a price range.{" "}
                      <span className={cn(classes.underline, classes.pointer)}>
                        {"Learn more>"}
                      </span>
                    </Typography>
                  ) : (
                    <Box className={classes.rangeStatus}>
                      <Typography>
                        <Tooltip
                          title="Your position will be 100% USDC at this price."
                          placement="bottom-start"
                          arrow
                        >
                          <span>Min:</span>
                        </Tooltip>{" "}
                        0.025 FTT per USDC
                      </Typography>
                      <ChevronRight />
                      <Typography>
                        <span>MAX:</span> 0.03 FTT per USDC
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Box className={classes.poolTerms}>
                  <Box style={{ width: "100px" }}>
                    <Typography className={classes.itemLabel}>
                      <span>APR</span> <List />
                    </Typography>
                    <Typography className={classes.itemContent}>
                      46.72%
                    </Typography>
                  </Box>
                  <Box style={{ width: "100px" }}>
                    <Typography className={classes.itemLabel}>
                      <span>Your share</span>
                    </Typography>
                    <Typography className={classes.itemContent}>
                      {"<0.01 %"}
                    </Typography>
                  </Box>
                  <Box style={{ width: "100px" }}>
                    <Typography className={classes.itemLabel}>
                      <span>Your reward</span>
                    </Typography>
                    <Typography className={classes.itemContent}>
                      0.02
                    </Typography>
                  </Box>
                </Box>
              </Box>
              {inRange !== undefined && (
                <Box
                  className={cn(classes.rangeHint, {
                    goodRange: inRange === true,
                    badRange: inRange === false,
                  })}
                >
                  <span>{inRange ? "In range" : "Out of range"}</span>
                </Box>
              )}
            </Box>

            <Box className={classes.poolButtons}>
              <Button className={classes.poolButton}>Deposit</Button>
              {hasWithdraw && (
                <Button
                  className={classes.borderButton}
                  onClick={() => setShowWithdrawModal(true)}
                  style={{ marginLeft: "12px" }}
                >
                  Withdraw
                </Button>
              )}
            </Box>

            {isDoubleDip === true && (
              <Box className={classes.doubleDipHint}>
                <Typography>
                  Stake your LP tokens in the <span>Double-Dip</span> tab to
                  earn additional SOL tokens.
                </Typography>
              </Box>
            )}
          </>
        )}
        {type === "doubleDip" && (
          <>
            <Box className={classes.assetsContainer}>
              <Box className={classes.assetsLogo}>
                <Box className={classes.emptyLogo} />
                <img src={USDC} alt="Coin" />
              </Box>
              <Box>
                <Typography variant="caption">SOL-USDC</Typography>
                <Typography>384M Ray • 2021/24 - 2022/23</Typography>
              </Box>
            </Box>
            <Box style={{ width: "70px" }}>
              <Typography className={classes.itemLabel}>
                <span className={classes.underline}>Ray APR</span>
              </Typography>
              <Typography className={classes.itemContent}>46.72%</Typography>
            </Box>
            <Box style={{ width: "190px" }}>
              <Typography className={classes.itemLabel}>
                <span>Total Staked</span>
              </Typography>
              <Typography className={classes.itemContent}>
                $ 476,369,789,123.0789
              </Typography>
            </Box>
            <Box className={classes.poolButtons}>
              {hasUndip && (
                <Button
                  className={classes.borderButton}
                  style={{ marginRight: "12px" }}
                >
                  Harvest & Undip
                </Button>
              )}
              <Button className={classes.poolButton} disabled={isDisable}>
                Double Dip
              </Button>
            </Box>
          </>
        )}
        {type === "closed" && (
          <>
            <Box className={classes.assetsContainer}>
              <Box className={classes.assetsLogo}>
                <Box className={classes.emptyLogo} />
                <img src={USDC} alt="Coin" />
              </Box>
              <Typography variant="caption">SOL-USDC</Typography>
            </Box>
            <Box style={{ width: "70px" }}>
              <Typography className={classes.itemLabel}>
                <span>APR</span> <List />
              </Typography>
              <Typography className={classes.itemContent}>46.72%</Typography>
            </Box>
            <Box style={{ width: "190px" }}>
              <Typography className={classes.itemLabel}>
                <span>Your Liquidity</span>
              </Typography>
              <Typography className={classes.itemContent}>
                476 LP Token - $100
              </Typography>
            </Box>
            <Box style={{ width: "100px" }}>
              <Typography className={classes.itemLabel}>
                <span>Your reward</span>
              </Typography>
              <Typography className={classes.itemContent}>0.02</Typography>
            </Box>
            <Box className={classes.poolButtons}>
              <Button className={classes.borderButton} disabled={isDisable}>
                Harvest & Unstake
              </Button>
            </Box>
          </>
        )}
      </Box>
      <DepositLiquidityModal
        open={showDepositModal}
        onClose={() => setShowDepositModal(false)}
      />
      <WithdrawLiquidityModal
        open={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
      />
    </Box>
  );
};

export default Pool;
