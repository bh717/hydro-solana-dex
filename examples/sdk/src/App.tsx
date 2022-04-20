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
import { AddLiquidity } from "./pages/AddLiquidity";
import { RemoveLiquidity } from "./pages/RemoveLiquidity";
import { Pools } from "./pages/Pools";
import { NetworkSelector } from "./components/NetworkSelector";
require("@solana/wallet-adapter-react-ui/styles.css");

function App() {
  const [value, setValue] = useState(0);
  const [tokenAInit, setTokenAInit] = useState<string | undefined>(undefined);
  const [tokenBInit, setTokenBInit] = useState<string | undefined>(undefined);

  // HACK: refresh the addLiquidity page when we click addLIquidity with values
  const [hackRenderAddLiquidity, setHackRenderAddLiquidity] = useState(true);

  const handleChange = (_: any, newValue: number) => {
    setValue(newValue);
  };

  // HACK: This is just to rerender the initial states of the tokenFields
  // it is a hack purely for the demo app as we don't use a router
  const onAddLiquidity = (tokenX: string, tokenY: string) => {
    setHackRenderAddLiquidity(false);
    setTokenAInit(tokenX);
    setTokenBInit(tokenY);
    setValue(2);
    setHackRenderAddLiquidity(true);
  };

  const onRemoveLiquidity = (tokenX: string, tokenY: string) => {
    setHackRenderAddLiquidity(false);
    setTokenAInit(tokenX);
    setTokenBInit(tokenY);
    setValue(3);
    setHackRenderAddLiquidity(true);
  };

  return (
    <Context>
      <div>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Demo
            </Typography>
            <NetworkSelector sx={{ flexGrow: 1 }} />
            <WalletMultiButton />
          </Toolbar>
        </AppBar>
        <Container>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={value} onChange={handleChange}>
              <Tab label="Swap" />
              <Tab label="Pools" />
              <Tab label="Add Liquidity" />
              <Tab label="Remove Liquidity" />
            </Tabs>
          </Box>
          <TabPanel value={value} index={0}>
            <Swap />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <Pools
              onAddLiquidity={onAddLiquidity}
              onRemoveLiquidity={onRemoveLiquidity}
            />
          </TabPanel>
          <TabPanel value={value} index={2}>
            {hackRenderAddLiquidity && (
              <AddLiquidity tokenAInit={tokenAInit} tokenBInit={tokenBInit} />
            )}
          </TabPanel>
          <TabPanel value={value} index={3}>
            {hackRenderAddLiquidity && (
              <RemoveLiquidity
                tokenAInit={tokenAInit}
                tokenBInit={tokenBInit}
              />
            )}
          </TabPanel>
        </Container>
      </div>
    </Context>
  );
}
export default App;
