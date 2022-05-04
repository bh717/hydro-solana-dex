import React, { FC, useState } from "react";
import { makeStyles } from "@mui/styles";
import {
  Box,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Typography,
  Menu,
  MenuItem,
} from "@mui/material";

import {
  Search,
  CaretDown,
  Hydraswap,
  Refresh,
  Gear,
} from "../../../../components/icons";
import MobileSortModal from "./mobileSort";

const useStyles = makeStyles({
  filterContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
    flexWrap: "wrap",
    "@media (max-width: 600px)": {
      marginBottom: "32px",
    },
  },
  searchContainer: {
    background: "#FFFFFF05",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    margin: "10px 15px 10px 0",
    width: "350px",
    "@media (max-width: 1070px)": {
      marginRight: 0,
      width: "100%",
    },
  },
  searchInput: {
    flexGrow: 1,
    "& .MuiInputBase-root": {
      paddingLeft: "16px",
      "& .MuiInputAdornment-root": {
        "& svg": {
          color: "#FFFFFF73",
          width: "20px !important",
          height: "20px !important",
        },
      },
      "& input": {
        color: "#FFF",
        fontSize: "14px",
        lineHeight: "24px",
        height: "initial",
        padding: "12px 8px 12px 0",
      },
      "& fieldset": {
        border: "none",
      },
    },
  },
  searchType: {
    display: "flex",
    paddingRight: "4px",
    "& .MuiButton-root": {
      color: "#FFFFFFA6",
      padding: "8px",
      minWidth: "initial",
      width: "58px",
      height: "40px",
      textTransform: "capitalize",
      "& .MuiTouchRipple-root": {
        display: "none",
      },
      "&.active, &:hover": {
        backgroundColor: "transparent",
        color: "#19CE9D",
      },
    },
  },
  sortContainer: {
    display: "flex",
    alignItems: "center",
    margin: "10px 0",
    "& > .MuiTypography-root": {
      color: "#FFFFFFA6",
      fontSize: "14px",
      lineHeight: "24px",
      marginRight: "4px",
    },
    "& > .MuiButton-root": {
      color: "#FFFFFFA6",
      padding: 0,
      margin: "0 6px",
      minWidth: "initial",
      "& span": {
        marginRight: "4px",
        fontWeight: "400",
        textTransform: "capitalize",
        lineHeight: "24px",
      },
      "& .MuiTouchRipple-root": {
        display: "none",
      },
      "&:first-of-type": {
        marginLeft: 0,
      },
      "&:last-of-type": {
        marginRight: 0,
      },
      "&:hover": {
        backgroundColor: "transparent",
      },
    },
    "& .divider": {
      background: "#C4C4C4",
      width: "1px",
      height: "16px",
      margin: "0 12px",
    },
    "@media (max-width: 950px)": {
      display: "none",
    },
  },
  sortBy: {
    width: "12px",
    height: "12px",
    position: "relative",
    "& > svg": {
      position: "absolute",
      width: "8px !important",
      height: "4px !important",
      top: "8px",
      left: "2px",
      "&.caretUp": {
        transform: "rotate(180deg)",
        top: "2px",
      },
    },
  },
  menuButton: {
    "& span": {
      "&:nth-child(2)": {
        color: "#FFF",
        fontWeight: "500",
        marginRight: "3px",
      },
    },
    "& svg": {
      width: "10px !important",
      height: "5px !important",
    },
  },
  menuContent: {
    "& .MuiMenu-paper": {
      backgroundColor: "#2A2D38",
      borderRadius: "6px",
      "& .MuiMenu-list": {
        padding: 0,
        "& .MuiMenuItem-root": {
          color: "#FFFFFFA6",
          fontSize: "14px",
          lineHeight: "24px",
          justifyContent: "center",
          padding: "4px 16px",
          width: "90px",
          "&:hover": {
            background: "#FFFFFF0F",
            color: "#FFF",
          },
        },
      },
    },
  },
  harvestContainer: {
    display: "flex",
    alignItems: "center",
    margin: "10px 0 10px 15px",
    "& .MuiIconButton-root": {
      background: "#FFFFFF0A",
      borderRadius: "6px",
      marginLeft: "10px",
      padding: "10px",
      "& > svg": {
        color: "#FFFFFFA6",
        width: "20px !important",
        height: "20px !important",
      },
      "&:hover": {
        backgroundColor: "#FFFFFF0A",
      },
    },
    "@media (min-width: 951px) and (max-width: 1350px)": {
      flex: 1,
      justifyContent: "flex-end",
    },
    "@media (max-width: 950px)": {
      marginLeft: 0,
      width: "100%",
      "& > .MuiIconButton-root": {
        display: "none",
      },
    },
  },
  mobileSort: {
    display: "none",
    "@media (max-width: 950px)": {
      display: "flex",
      flexGrow: 1,
      justifyContent: "end",
    },
  },
  harvestAmount: {
    display: "flex",
    alignItems: "center",
    marginRight: "10px",
    "& svg": {
      marginRight: "4px",
    },
    "& p": {
      color: "#FFFFFFD9",
      lineHeight: "19px",
    },
  },
  harvestButton: {
    background: "linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)",
    borderRadius: "6px !important",
    color: "#19CE9D !important",
    padding: "8px 16px !important",
    lineHeight: "24px !important",
    textTransform: "capitalize !important" as any,
    width: "107px",
    "& span": {
      position: "relative",
    },
    "&::before": {
      content: "''",
      position: "absolute",
      top: "1px",
      right: "1px",
      bottom: "1px",
      left: "1px",
      borderRadius: "6px",
      background: "#1d202d",
    },
    "&:hover": {
      background: "#19CE9D !important",
      color: "#FFF !important",
      "&::before": {
        background: "transparent",
      },
    },
  },
});

interface FilterProps {
  type?: string;
}

const Filter: FC<FilterProps> = ({ type }) => {
  const classes = useStyles();

  const [openSortModal, setOpenSortModal] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box className={classes.filterContainer}>
      <Box className={classes.searchContainer}>
        <TextField
          hiddenLabel
          className={classes.searchInput}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        <Box className={classes.searchType}>
          <Button className="active">ALL</Button>
          <Button>HMM</Button>
          <Button>Stable</Button>
        </Box>
      </Box>
      <Box className={classes.sortContainer}>
        <Typography>Sort by:</Typography>
        <Button>
          <span>Liquidity</span>
          <Box className={classes.sortBy}>
            <CaretDown className="caretUp" />
            <CaretDown />
          </Box>
        </Button>
        <Button>
          <span>Volume</span>
          <Box className={classes.sortBy}>
            <CaretDown className="caretUp" />
            <CaretDown />
          </Box>
        </Button>
        <Button>
          <span>APR</span>
          <Box className={classes.sortBy}>
            <CaretDown className="caretUp" />
            <CaretDown />
          </Box>
        </Button>
        <span className="divider" />
        <Button className={classes.menuButton} onClick={handleClick}>
          <span>APR Basis:</span>
          <span>7D</span>
          <CaretDown />
        </Button>
        <Menu
          className={classes.menuContent}
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
        >
          <MenuItem onClick={handleClose}>24H</MenuItem>
          <MenuItem onClick={handleClose}>7D</MenuItem>
          <MenuItem onClick={handleClose}>30D</MenuItem>
        </Menu>
      </Box>
      <Box className={classes.harvestContainer}>
        {type !== "closed" && (
          <>
            <Box className={classes.harvestAmount}>
              <Hydraswap />
              <Typography>0.0</Typography>
            </Box>
            <Button className={classes.harvestButton}>
              <span>Harvest All</span>
            </Button>
            <IconButton className="refresh-btn">
              <Refresh />
            </IconButton>
          </>
        )}
        <Box className={classes.mobileSort}>
          <IconButton onClick={() => setOpenSortModal(true)}>
            <Gear />
          </IconButton>
        </Box>
      </Box>
      <MobileSortModal
        open={openSortModal}
        onClose={() => setOpenSortModal(false)}
      />
    </Box>
  );
};

export default Filter;
