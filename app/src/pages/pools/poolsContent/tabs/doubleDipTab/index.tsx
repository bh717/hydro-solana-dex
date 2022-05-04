import { makeStyles } from "@mui/styles";
import { Box } from "@mui/material";

// import Filter from "../../filter";
// import Pool from "../../pool";

const useStyles = makeStyles({
  tabContainer: {
    display: "flex",
    flexDirection: "column",
  },
  tabContent: {},
});

const DoubleDipTab = () => {
  const classes = useStyles();

  return (
    <Box className={classes.tabContainer}>
      {/* <Filter /> */}
      <Box className={classes.tabContent}>
        {/*
        <Pool type="doubleDip" isDisable={true} />
        <Pool type="doubleDip" hasUndip={true} />
        */}
      </Box>
    </Box>
  );
};

export default DoubleDipTab;
