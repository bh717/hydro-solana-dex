import { makeStyles } from "@mui/styles";
import { Box } from "@mui/material";
import { useExistingPools } from "hydra-react-ts";

// import Filter from "../../filter";
import Pool from "../../pool";

const useStyles = makeStyles({
  tabContainer: {
    display: "flex",
    flexDirection: "column",
  },
  tabContent: {},
});

const PoolsTab = () => {
  const classes = useStyles();

  const pools = useExistingPools();
  return (
    <Box className={classes.tabContainer}>
      {/* <Filter /> */}
      <Box className={classes.tabContent}>
        {pools.length > 0 ? (
          pools.map(([tokenA, tokenB]) => {
            return (
              <Pool
                key={`${tokenA.address}-${tokenB.address}`}
                type="all"
                tokenA={tokenA}
                tokenB={tokenB}
                isDoubleDip={true}
                hasWithdraw={true}
              />
            );
          })
        ) : (
          <></>
        )}
      </Box>
    </Box>
  );
};

export default PoolsTab;
