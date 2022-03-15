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
import React, { FC, ReactNode, useCallback, useMemo, useState } from "react";
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
import { useObservable } from "react-use";
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

const Content: FC = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const [stakeAmount, setStakeAmount] = useState<string>("0");
  const [unstakeAmount, setUnstakeAmount] = useState<string>("0");

  const sdk = useMemo(
    () => HydraSDK.create("localnet", connection, wallet),
    [connection, wallet]
  );

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
                        <Typography variant="h6">Contract Accounts</Typography>
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
                      <TableCell>
                        {trunc(`${tokenVault.account.data.amount}`)}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
            <Box>
              <Input
                type="number"
                onChange={handleStakeAmountUpdated}
                value={stakeAmount}
                placeholder="amount"
              />
              <Button variant="contained" onClick={handleStakeClicked}>
                Stake
              </Button>
            </Box>
            <Box>
              <Input
                type="number"
                onChange={handleUnstakeAmountUpdated}
                value={unstakeAmount}
                placeholder="amount"
              />
              <Button variant="contained" onClick={handleUnstakeClicked}>
                Unstake
              </Button>
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
