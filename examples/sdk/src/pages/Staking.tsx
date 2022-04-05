import React, { useCallback, useMemo, useState } from "react";
import {
  Button,
  InputAdornment,
  OutlinedInput,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useObservable } from "react-use";
import { Box } from "@mui/system";
import { useHydraClient } from "../components/HydraClientProvider";
import { DisplayToken } from "../components/DisplayToken";

export function Staking() {
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
}
