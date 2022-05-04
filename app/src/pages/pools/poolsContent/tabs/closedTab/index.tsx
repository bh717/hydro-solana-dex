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

const ClosedTab = () => {
  const classes = useStyles();

  return (
    <Box className={classes.tabContainer}>
      {/* <Filter type="closed" /> */}
      <Box className={classes.tabContent}>
        {/*
        <Pool type="closed" isDisable={true} />
        <Pool type="closed" />
        */}
      </Box>
    </Box>
  );
};

export default ClosedTab;
