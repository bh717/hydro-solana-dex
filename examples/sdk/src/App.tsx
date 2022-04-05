import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState } from "react";
import {
  AppBar,
  Container,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";

// import { Staking } from "./pages/Staking";
// import { Pool } from "./pages/Pool";
// import { Wasm } from "./pages/Wasm";
import { Swap } from "./pages/Swap";
import { Context } from "./Context";
import { TabPanel } from "./components/TabPanel";
require("@solana/wallet-adapter-react-ui/styles.css");

function App() {
  const [value, setValue] = useState(0);

  const handleChange = (_: any, newValue: number) => {
    setValue(newValue);
  };
  return (
    <Context>
      <div>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Demo
            </Typography>
            <WalletMultiButton />
          </Toolbar>
        </AppBar>
        <Container>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={value} onChange={handleChange}>
              <Tab label="Swap" />
              {/* <Tab label="Pool" />
              <Tab label="Wasm" /> */}
            </Tabs>
          </Box>
          <TabPanel value={value} index={0}>
            <Swap />
          </TabPanel>
          {/* <TabPanel value={value} index={0}>
            <Staking />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <Pool />
          </TabPanel>
          <TabPanel value={value} index={2}>
            <Wasm />
          </TabPanel> */}
        </Container>
      </div>
    </Context>
  );
}
export default App;
