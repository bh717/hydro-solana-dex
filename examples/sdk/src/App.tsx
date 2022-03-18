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
import { AccountLoader, HydraSDK } from "hydra-ts";
import React, {
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AppBar,
  Button,
  Container,
  FormLabel,
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
import { Observable } from "rxjs";
import { Box } from "@mui/system";
import tokenMap from "config-ts/tokens/localnet.json";
import { PublicKey } from "@solana/web3.js";
import { combineLatest } from "rxjs";
import { TokenAccount } from "hydra-ts/src/types/token-account";
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

function DisplayToken({
  token,
}: {
  token?: AccountLoader.AccountPubkey<TokenAccount>;
}) {
  if (!token) return null;
  return (
    <TableRow key={`${token.pubkey}`}>
      <TableCell>{trunc(`${token.pubkey}`)}</TableCell>
      <TableCell>{trunc(`${token.account.data.mint}`)}</TableCell>
      <TableCell>{trunc(`${token.account.data.owner}`)}</TableCell>
      <TableCell>{`${token.account.data.amount}`}</TableCell>
    </TableRow>
  );
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
              {userFrom && <DisplayToken token={userFrom} />}
              {userRedeemable && <DisplayToken token={userRedeemable} />}

              {tokenVault && (
                <>
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography variant="h6">tokenVault</Typography>
                    </TableCell>
                  </TableRow>
                  <DisplayToken token={tokenVault} />
                </>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    </div>
  );
};

const usdMint = new PublicKey(tokenMap.tokens.usdc);
const btcMint = new PublicKey(tokenMap.tokens.btc);
type PromiseVal<T> = T extends Promise<infer J> ? J : never;

function useLiquidityAccounts(sdk: HydraSDK) {
  type Accounts = PromiseVal<
    ReturnType<typeof sdk.liquidityPools.accounts.getAccountLoaders>
  >;
  const [accounts, setAccounts] = useState<Accounts | undefined>();

  useEffect(() => {
    (async function () {
      const accs = await sdk.liquidityPools.accounts.getAccountLoaders(
        btcMint,
        usdMint
      );
      setAccounts(accs);
    })();
  }, [sdk]);
  return accounts;
}

function maybeStream<T>(
  streamOrUndefined: Observable<T> | undefined
): Observable<T | undefined> {
  if (!streamOrUndefined) return new Observable((s) => s.next(undefined));
  return streamOrUndefined;
}

const Pool: FC = () => {
  const sdk = useHydraClient();

  const [liquidityTokenA, setLiquidityTokenA] = useState(0);
  const [liquidityTokenB, setLiquidityTokenB] = useState(0);

  const streams = useObservable(
    useMemo(() => {
      const { toAssociatedTokenAccount } = sdk.common;

      const usd = toAssociatedTokenAccount(usdMint).stream();
      const btc = toAssociatedTokenAccount(btcMint).stream();

      return combineLatest({ usd, btc });
    }, [sdk])
  );

  const accounts = useLiquidityAccounts(sdk);

  const tokenXVault = useObservable(
    useMemo(() => maybeStream(accounts?.tokenXVault.stream()), [accounts])
  );

  const tokenYVault = useObservable(
    useMemo(() => maybeStream(accounts?.tokenYVault.stream()), [accounts])
  );

  const handleTokenAChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLiquidityTokenA(Number(e.target.value));
  };

  const handleTokenBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLiquidityTokenB(Number(e.target.value));
  };

  const handleAddLiquidityClicked = async () => {
    await sdk.liquidityPools.addLiquidity(
      btcMint,
      usdMint,
      BigInt(liquidityTokenA),
      BigInt(liquidityTokenB),
      0n
    );
  };

  return (
    <div>
      <Paper component="div">
        <Stack>
          {sdk.ctx.isSignedIn() ? (
            <>
              <Stack padding={1} gap={2} maxWidth={500}>
                <TextField
                  type="number"
                  onChange={handleTokenAChange}
                  label={tokenMap.tokens.btc}
                  value={liquidityTokenA}
                />
                <FormLabel>Suggestion: 6000000</FormLabel>
                <TextField
                  type="number"
                  onChange={handleTokenBChange}
                  label={tokenMap.tokens.usdc}
                  value={liquidityTokenB}
                />
                <FormLabel>Suggestion: 255575287200</FormLabel>
                <Button variant="contained" onClick={handleAddLiquidityClicked}>
                  Add Liquidity
                </Button>
              </Stack>
              <Box padding={1}>
                <Button variant="contained" onClick={handleAddLiquidityClicked}>
                  Swap
                </Button>
              </Box>
            </>
          ) : (
            <Typography>Please connect your wallet</Typography>
          )}
        </Stack>
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
            {streams?.usd && <DisplayToken token={streams.usd} />}
            {streams?.btc && <DisplayToken token={streams.btc} />}
            <TableRow>
              <TableCell colSpan={4}>
                <Typography variant="h6">Pool</Typography>
              </TableCell>
            </TableRow>
            {tokenXVault && <DisplayToken token={tokenXVault} />}
            {tokenYVault && <DisplayToken token={tokenYVault} />}
          </TableBody>
        </Table>
      </Paper>
    </div>
  );
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
