import React, { useMemo, useState } from "react";
import {
  Button,
  FormLabel,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useObservable } from "react-use";
import { Box } from "@mui/system";
// import tokenMap from "config-ts/tokens/localnet.json";
import { combineLatest } from "rxjs";
import { btcMint, btcToken, usdcToken, usdMint } from "../config/tokens";
import { useHydraClient } from "../components/HydraClientProvider";
import { maybeStream } from "../utils/maybeStream";
import { useLiquidityPoolAccounts } from "../hooks/useLiquidityPoolAccounts";
import { DisplayToken } from "../components/DisplayToken";

export function Pool() {
  const sdk = useHydraClient();

  const streams = useObservable(
    useMemo(() => {
      const { toAssociatedTokenAccount } = sdk.common;

      const usd = toAssociatedTokenAccount(usdMint).stream();
      const btc = toAssociatedTokenAccount(btcMint).stream();

      return combineLatest([usd, btc]);
    }, [sdk])
  );

  const accounts = useLiquidityPoolAccounts(sdk, btcMint, usdMint);

  const tokenXVault = useObservable(
    useMemo(() => maybeStream(accounts?.tokenXVault.stream()), [accounts])
  );

  const tokenYVault = useObservable(
    useMemo(() => maybeStream(accounts?.tokenYVault?.stream()), [accounts])
  );

  const lpTokenAssociatedAccount = useObservable(
    useMemo(
      () => maybeStream(accounts?.lpTokenAssociatedAccount.stream()),
      [accounts]
    )
  );

  /////////////////////////////////////////////////////////
  const [liquidityTokenA, setLiquidityTokenA] = useState(0);
  const [liquidityTokenB, setLiquidityTokenB] = useState(0);

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
  ///////////////////////////////////////////////////////////
  const [swapTokenA, setSwapTokenA] = useState(0);
  const [swapTokenB, setSwapTokenB] = useState(0);

  const handleSwapTokenAChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSwapTokenA(Number(e.target.value));
  };

  const handleSwapTokenBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSwapTokenB(Number(e.target.value));
  };

  const handleSwapClicked = async () => {
    if (!accounts) throw new Error("Error creating accounts");
    const userBtc = await accounts?.userTokenX.key();
    const userUsd = await accounts?.userTokenY.key();

    await sdk.liquidityPools.swap(
      btcMint,
      usdMint,
      userBtc,
      userUsd,
      BigInt(swapTokenA),
      BigInt(swapTokenB)
    );
  };

  ///////////////////////////////////////////////////////////
  const [removeLpTokenAmount, setRemoveToken] = useState(0);

  const handleRemoveTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRemoveToken(Number(e.target.value));
  };

  const handleRemoveClicked = async () => {
    if (!accounts) throw new Error("Error creating accounts");

    await sdk.liquidityPools.removeLiquidity(
      btcMint,
      usdMint,
      BigInt(removeLpTokenAmount)
    );
  };
  return (
    <div>
      <Paper component="div">
        <Stack>
          {sdk.ctx.isSignedIn() ? (
            <Box display="flex" justifyContent={"stretch"}>
              <Stack padding={1} gap={2} maxWidth={500}>
                <TextField
                  type="number"
                  onChange={handleTokenAChange}
                  label={btcToken.address}
                  value={liquidityTokenA}
                />
                <FormLabel>Suggestion: 6000000</FormLabel>
                <TextField
                  type="number"
                  onChange={handleTokenBChange}
                  label={usdcToken.address}
                  value={liquidityTokenB}
                />
                <FormLabel>Suggestion: 255575287200</FormLabel>
                <Button variant="contained" onClick={handleAddLiquidityClicked}>
                  Add Liquidity
                </Button>
              </Stack>
              <Stack padding={1} gap={2} maxWidth={500}>
                <TextField
                  type="number"
                  onChange={handleSwapTokenAChange}
                  label={btcToken.address}
                  value={swapTokenA}
                />
                <FormLabel>Suggestion: 1000</FormLabel>
                <TextField
                  type="number"
                  onChange={handleSwapTokenBChange}
                  label={usdcToken.address}
                  value={swapTokenB}
                />
                <FormLabel>Suggestion: 36510755</FormLabel>
                <Button variant="contained" onClick={handleSwapClicked}>
                  Swap
                </Button>
              </Stack>
              <Stack padding={1} gap={2} maxWidth={500}>
                <TextField
                  type="number"
                  onChange={handleRemoveTokenChange}
                  value={removeLpTokenAmount}
                />
                <FormLabel>Suggestion: 1238326078</FormLabel>
                <Button variant="contained" onClick={handleRemoveClicked}>
                  Remove Liquidity
                </Button>
              </Stack>
            </Box>
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
            {streams && streams[0] && <DisplayToken token={streams[0]} />}
            {streams && streams[1] && <DisplayToken token={streams[1]} />}
            <TableRow>
              <TableCell colSpan={4}>
                <Typography variant="h6">Pool</Typography>
              </TableCell>
            </TableRow>
            {tokenXVault && <DisplayToken token={tokenXVault} />}
            {tokenYVault && <DisplayToken token={tokenYVault} />}
            {lpTokenAssociatedAccount && (
              <DisplayToken token={lpTokenAssociatedAccount} />
            )}
          </TableBody>
        </Table>
      </Paper>
    </div>
  );
}
