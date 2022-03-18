import {
  ConnectionProvider,
  useConnection,
  WalletProvider,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { HydraSDK } from "hydra-ts";
import React, {
  FC,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  AppBar,
  Button,
  Container,
  Input,
  InputAdornment,
  OutlinedInput,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { useObservable } from "react-use";
import { Box } from "@mui/system";

require("@solana/wallet-adapter-react-ui/styles.css");

function TabPanel(props: {
  children: React.ReactNode;
  value: number;
  index: number;
}) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography component="span">{children}</Typography>
        </Box>
      )}
    </div>
  );
}
const App: FC = () => {
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
              <Tab label="Staking" />
              <Tab label="Pool" />
              <Tab label="Wasm" />
            </Tabs>
          </Box>
          <TabPanel value={value} index={0}>
            <Staking />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <Pool />
          </TabPanel>
          <TabPanel value={value} index={2}>
            <Wasm />
          </TabPanel>
        </Container>
      </div>
    </Context>
  );
};
export default App;

const Context: FC<{ children: ReactNode }> = ({ children }) => {
  const endpoint = "http://localhost:8899";

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <HydraClientProvider>{children}</HydraClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

function trunc(str: string) {
  return [str.slice(0, 4), str.slice(-4)].join("..");
}

function HydraClientProvider(p: { children: React.ReactNode }) {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const sdk = useMemo(() => {
    console.log("creating new client...");
    return HydraSDK.create("localnet", connection, wallet);
  }, [connection, wallet]);

  return (
    <HydraClientContext.Provider value={sdk}>
      {p.children}
    </HydraClientContext.Provider>
  );
}

const HydraClientContext = React.createContext({} as HydraSDK);

function useHydraClient() {
  return useContext(HydraClientContext);
}

const Staking: FC = () => {
  const [stakeAmount, setStakeAmount] = useState<string>("0");
  const [unstakeAmount, setUnstakeAmount] = useState<string>("0");

  const sdk = useHydraClient();

  const userFrom = useObservable(
    useMemo(() => sdk.staking.accounts.userToken.stream(), [sdk])
  );

  const userRedeemable = useObservable(
    useMemo(() => sdk.staking.accounts.userRedeemable.stream(), [sdk])
  );

  const tokenVault = useObservable(
    useMemo(() => sdk.staking.accounts.tokenVault.stream(), [sdk])
  );

  const handleStakeAmountUpdated = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setStakeAmount(e.target.value);
    },
    []
  );

  const handleUnstakeAmountUpdated = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUnstakeAmount(e.target.value);
    },
    []
  );

  const handleStakeClicked = useCallback(async () => {
    await sdk.staking.stake(BigInt(stakeAmount));
    setStakeAmount("0");
  }, [sdk, stakeAmount]);

  const handleUnstakeClicked = useCallback(async () => {
    await sdk.staking.unstake(BigInt(unstakeAmount));
    setUnstakeAmount("0");
  }, [sdk, unstakeAmount]);

  console.log({ sdk, userFrom, userRedeemable, tokenVault });

  return (
    <div>
      <Stack paddingTop={2}>
        <Paper sx={{ padding: 2, marginBottom: 2 }}>
          {sdk.ctx.isSignedIn() ? (
            <>
              <Stack>
                <Typography>Enter amount to stake</Typography>
                <Box padding={1}>
                  <OutlinedInput
                    type="number"
                    onChange={handleStakeAmountUpdated}
                    value={stakeAmount}
                    placeholder="amount"
                    fullWidth
                    endAdornment={
                      <InputAdornment position="end">
                        <Button
                          variant="contained"
                          style={{ width: 100 }}
                          onClick={handleStakeClicked}
                        >
                          Stake
                        </Button>
                      </InputAdornment>
                    }
                  />
                </Box>
              </Stack>
              <Stack>
                <Typography>Enter amount to unstake</Typography>
                <Box padding={1}>
                  <OutlinedInput
                    type="number"
                    onChange={handleUnstakeAmountUpdated}
                    value={unstakeAmount}
                    placeholder="amount"
                    fullWidth
                    endAdornment={
                      <InputAdornment position="end">
                        <Button
                          style={{ width: 100 }}
                          variant="contained"
                          onClick={handleUnstakeClicked}
                        >
                          Unstake
                        </Button>
                      </InputAdornment>
                    }
                  />
                </Box>
              </Stack>
            </>
          ) : (
            <Typography>Please connect your wallet</Typography>
          )}
        </Paper>
        <Paper component="div">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Address</TableCell>
                <TableCell>Mint</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Balance</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography variant="h6">My Accounts</Typography>
                </TableCell>
              </TableRow>
              {userFrom && (
                <TableRow key={`${userFrom.pubkey}`}>
                  <TableCell>{trunc(`${userFrom.pubkey}`)}</TableCell>
                  <TableCell>
                    {trunc(`${userFrom.account.data.mint}`)}
                  </TableCell>
                  <TableCell>
                    {trunc(`${userFrom.account.data.owner}`)}
                  </TableCell>
                  <TableCell>{`${userFrom.account.data.amount}`}</TableCell>
                </TableRow>
              )}
              {userRedeemable && (
                <TableRow key={`${userRedeemable.pubkey}`}>
                  <TableCell>{trunc(`${userRedeemable.pubkey}`)}</TableCell>
                  <TableCell>
                    {trunc(`${userRedeemable.account.data.mint}`)}
                  </TableCell>
                  <TableCell>
                    {trunc(`${userRedeemable.account.data.owner}`)}
                  </TableCell>
                  <TableCell>{`${userRedeemable.account.data.amount}`}</TableCell>
                </TableRow>
              )}

              {tokenVault && (
                <>
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography variant="h6">tokenVault</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow key={`${tokenVault.pubkey}`}>
                    <TableCell>{trunc(`${tokenVault.pubkey}`)}</TableCell>
                    <TableCell>
                      {trunc(`${tokenVault.account.data.mint}`)}
                    </TableCell>
                    <TableCell>
                      {trunc(`${tokenVault.account.data.owner}`)}
                    </TableCell>
                    <TableCell>{`${tokenVault.account.data.amount}`}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    </div>
  );
};

const Pool: FC = () => {
  return <div>Pool</div>;
};

const Wasm: FC = () => {
  const sdk = useHydraClient();

  const handleDemoClicked = useCallback(async () => {
    const answer = await sdk.staking.calculatePoolTokensForDeposit(
      100n,
      2000n,
      100_000_000n
    );

    alert(answer);
  }, [sdk]);

  return (
    <div>
      <Stack paddingTop={2}>
        <Paper sx={{ padding: 2, marginBottom: 2 }}>
          <Typography variant="h6" component="div">
            Wasm Test
          </Typography>
          <Button variant="contained" onClick={handleDemoClicked}>
            Demonstrate Calculate
          </Button>
        </Paper>
      </Stack>
    </div>
  );
};
