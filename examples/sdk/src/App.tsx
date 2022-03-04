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
import { HydraSDK, SPLAccountInfo } from "hydra-ts";
import React, {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AppBar,
  Button,
  Container,
  Input,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Toolbar,
  Typography,
} from "@mui/material";
import { Observable } from "rxjs";
import { useObservable } from "react-use";
import { PublicKey } from "@solana/web3.js";
import { Box } from "@mui/system";

require("@solana/wallet-adapter-react-ui/styles.css");

const App: FC = () => {
  return (
    <Context>
      <Content />
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
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

function trunc(str: string) {
  return [str.slice(0, 4), str.slice(-4)].join("..");
}

function useMyAccounts(sdk: HydraSDK) {
  type MyAccounts = {
    account1: SPLAccountInfo;
    account2: SPLAccountInfo;
  };

  const [myAccounts, setAccounts] = useState<Array<PublicKey>>([]);

  useEffect(() => {
    sdk.common.getTokenAccounts().then(setAccounts);
  }, [sdk]);

  const accounts$ = useMemo(() => {
    if (myAccounts.length === 0) return new Observable<void>((s) => s.next());

    const [account1, account2] = myAccounts;
    // Pass in structure of the value output you would like ...
    return sdk.common.getTokenAccountInfoStreams({
      account1,
      account2,
    });
  }, [myAccounts, sdk]);

  return useObservable<void | MyAccounts>(accounts$);
}

function useContractAccounts(sdk: HydraSDK) {
  type ContractAccounts = {
    tokenVault: SPLAccountInfo;
  };
  const [tokenVaultKey, setTokenVaultKey] = useState<PublicKey>();

  useEffect(() => {
    sdk.staking.accounts.tokenVault.key().then(setTokenVaultKey);
  }, [sdk]);

  const contractAccounts$ = useMemo(() => {
    if (!tokenVaultKey) return new Observable<void>((s) => s.next());

    return sdk.common.getTokenAccountInfoStreams({
      tokenVault: tokenVaultKey,
    });
  }, [tokenVaultKey, sdk]);
  return useObservable<void | ContractAccounts>(contractAccounts$);
}

const Content: FC = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const [stakeAmount, setStakeAmount] = useState<string>("0");

  const sdk = useMemo(
    () => HydraSDK.create("localnet", connection, wallet),
    [connection, wallet]
  );

  const myaccounts = useMyAccounts(sdk);
  const contractAccounts = useContractAccounts(sdk);
  console.log({ contractAccounts });

  const handleStakeAmountUpdated = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setStakeAmount(e.target.value);
    },
    []
  );

  const handleStakeClicked = useCallback(async () => {
    await sdk.staking.stake(BigInt(stakeAmount));
  }, [sdk, stakeAmount]);

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
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Demo
          </Typography>
          <WalletMultiButton />
        </Toolbar>
      </AppBar>
      <Container>
        <Stack paddingTop={2}>
          <Paper sx={{ padding: 2, marginBottom: 2 }}>
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
                {!!myaccounts && (
                  <>
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography variant="h6">My Accounts</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow key={myaccounts.account1.address.toString()}>
                      <TableCell>
                        {trunc(myaccounts.account1.address.toString())}
                      </TableCell>
                      <TableCell>
                        {trunc(myaccounts.account1.mint.toString())}
                      </TableCell>
                      <TableCell>
                        {trunc(myaccounts.account1.owner.toString())}
                      </TableCell>
                      <TableCell>
                        {myaccounts.account1.amount.toString()}
                      </TableCell>
                    </TableRow>
                    <TableRow key={myaccounts.account2.address.toString()}>
                      <TableCell>
                        {trunc(myaccounts.account2.address.toString())}
                      </TableCell>
                      <TableCell>
                        {trunc(myaccounts.account2.mint.toString())}
                      </TableCell>
                      <TableCell>
                        {trunc(myaccounts.account2.owner.toString())}
                      </TableCell>
                      <TableCell>
                        {myaccounts.account2.amount.toString()}
                      </TableCell>
                    </TableRow>
                  </>
                )}
                {!!contractAccounts && (
                  <>
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography variant="h6">Contract Accounts</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow
                      key={contractAccounts.tokenVault.address.toString()}
                    >
                      <TableCell>
                        {trunc(contractAccounts.tokenVault.address.toString())}
                      </TableCell>
                      <TableCell>
                        {trunc(contractAccounts.tokenVault.mint.toString())}
                      </TableCell>
                      <TableCell>
                        {trunc(contractAccounts.tokenVault.owner.toString())}
                      </TableCell>
                      <TableCell>
                        {contractAccounts.tokenVault.amount.toString()}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
            <Box>
              <Button onClick={handleStakeClicked}>Stake</Button>
              <Input
                type="number"
                onChange={handleStakeAmountUpdated}
                value={stakeAmount}
                placeholder="amount"
              />
            </Box>
          </Paper>

          <Paper sx={{ padding: 2, marginBottom: 2 }}>
            <Typography variant="h6" component="div">
              Wasm Test
            </Typography>
            <Button variant="contained" onClick={handleDemoClicked}>
              Demonstrate Calculate
            </Button>
          </Paper>
        </Stack>
      </Container>
    </div>
  );
};
