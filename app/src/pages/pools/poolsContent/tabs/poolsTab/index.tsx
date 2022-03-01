import React from "react";
import { makeStyles } from "@mui/styles";
import { Box } from "@mui/material";

import Filter from "../../filter";
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

  return (
    <Box className={classes.tabContainer}>
      <Filter />
      <Box className={classes.tabContent}>
        <Pool type="all" isDoubleDip={true} hasWithdraw={true} />
        <Pool type="all" isDoubleDip={true} />
        <Pool type="all" />
        <Pool type="all" />
      </Box>
    </Box>
  );
};

export default PoolsTab;
