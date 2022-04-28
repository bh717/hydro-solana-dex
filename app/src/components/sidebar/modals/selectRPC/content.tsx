import { makeStyles } from "@mui/styles";
import { Box, Typography, Button } from "@mui/material";

import { Check } from "../../../icons";
import { useNetworkProvider } from "hydra-react-ts";

const useStyles = makeStyles({
  contentTitle: {
    borderBottom: "1px solid #FFFFFF0F",
    color: "#FFF",
    fontSize: "18px !important",
    fontWeight: "500 !important",
    lineHeight: "22px !important",
    padding: "23px 20px",
    margin: "0 3px",
  },
  contentWrapper: {
    display: "flex",
    flexDirection: "column",
    padding: "14px 0px",
    "& > .MuiButton-root": {
      color: "#FFFFFFD9",
      display: "flex",
      justifyContent: "space-between",
      fontSize: "18px !important",
      fontWeight: "400 !important",
      lineHeight: "21px !important",
      padding: "18px 19px !important",
      textTransform: "capitalize !important" as any,
      "& > svg": {
        fill: "#19CE9D",
        width: "21px !important",
        height: "15px !important",
      },
      "& > .MuiTouchRipple-root": {
        display: "none",
      },
      "&:hover": {
        backgroundColor: "#FFFFFF0F",
      },
    },
  },
});

const Content = () => {
  const classes = useStyles();

  const { meta, setNetwork, networks } = useNetworkProvider();

  return (
    <>
      <Typography className={classes.contentTitle}>
        Select Environment
      </Typography>
      <Box className={classes.contentWrapper}>
        {networks.map(({ network, name, endpoint }, index) => (
          <Button key={index} onClick={() => setNetwork(network)}>
            <span>{name}</span>
            {meta.endpoint === endpoint && <Check />}
          </Button>
        ))}
      </Box>
    </>
  );
};

export default Content;
