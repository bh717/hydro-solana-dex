import { makeStyles } from "@mui/styles";
import { Box } from "@mui/material";

import Filter from "../../filter";
// import Pool from "../../pool";

const useStyles = makeStyles({
  tabContainer: {
    display: "flex",
    flexDirection: "column",
  },
  tabContent: {},
});

const LiquidityTab = () => {
  const classes = useStyles();

  return (
    <Box className={classes.tabContainer}>
      <Filter />
      <Box className={classes.tabContent}>
        {/*
        <Pool type="liquidity" hasWithdraw={true} inRange={true} />
        <Pool type="liquidity" hasWithdraw={true} />
        <Pool
          type="liquidity"
          isDoubleDip={true}
          hasWithdraw={true}
          inRange={false}
        />
        */}
      </Box>
    </Box>
  );
};

export default LiquidityTab;
