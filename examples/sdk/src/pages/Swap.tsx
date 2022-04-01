import {
  Paper,
  Stack,
  Typography,
  Button,
  Alert,
  Table,
  TableRow,
  TableCell,
} from "@mui/material";
import { toFormat } from "../utils/toFormat";
import IconButton from "@mui/material/IconButton";
// import { useHydraClient } from "../components/HydraClientProvider";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import { TokenField } from "../components/TokenField";
import { States, useSwap } from "../hooks/useSwap";
import { SwapPreviewModal } from "../components/SwapPreviewModal";
import { SwapProcessModal } from "../components/SwapProcessModal";
import { SwapErrorModal } from "../components/SwapErrorModal";
import { SwapSuccessModal } from "../components/SwapSuccessModal";
import { Box } from "@mui/system";
import tokens from "config-ts/tokens/localnet.json";
import { useHydraClient } from "../components/HydraClientProvider";
import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { useObservable } from "../hooks/useObservable";
import { Asset } from "../types";
import { combineLatest } from "rxjs";
import { map } from "rxjs/operators";

function useBalances(assetList: Asset[]) {
  const client = useHydraClient();
  return useMemo(() => {
    const streamList$ = assetList.map((asset) => {
      console.log("mapping...");
      return client.accountLoaders
        .associatedToken(new PublicKey(asset.address))
        .stream()
        .pipe(map((account) => account?.account?.data?.amount ?? 0n));
    });
    return combineLatest(streamList$);
  }, [assetList, client]);
}

function useCombineAssetBalances(
  assetList: Asset[],
  balances: bigint[] | undefined
) {
  return useMemo(
    () =>
      assetList.map((asset, index) => ({
        ...asset,
        balance: balances ? balances[index] : 0n,
      })),
    [assetList, balances]
  );
}

const assets = tokens.tokens;

function useAssetBalances() {
  const balances$ = useBalances(assets);
  const balances = useObservable(balances$);

  const combined = useCombineAssetBalances(assets, balances);
  return combined;
}

export function Swap() {
  const client = useHydraClient();

  const swapProps = useSwap();
  const {
    tokenFrom,
    tokenTo,
    assetsTokenFrom,
    assetsTokenTo,
    toggleFields,
    poolExists,
    poolPairSelected,
    canSwap,
    onSubmitRequested,
    state,
    onCancelRequested,
  } = swapProps;

  // const balances = useAssetBalances();
  const balances = useAssetBalances();

  return (
    <>
      <Box
        paddingTop={2}
        gap={2}
        display="flex"
        flexDirection="row"
        justifyContent={"space-between"}
      >
        <Box alignItems={"center"}>
          <Paper sx={{ padding: 6, minWidth: 400 }}>
            <Box
              gap={2}
              flexDirection="column"
              textAlign={"center"}
              display="flex"
            >
              <Typography textAlign="center" variant="h6" component="h6">
                Swap
              </Typography>
              <Stack direction={"row"}>
                <TokenField token={tokenFrom} assets={assetsTokenFrom} />
              </Stack>
              <Box>
                <IconButton
                  onClick={toggleFields}
                  color="primary"
                  component="span"
                >
                  <SwapVertIcon />
                </IconButton>
              </Box>
              <Stack direction={"row"}>
                <TokenField token={tokenTo} assets={assetsTokenTo} />
              </Stack>

              <Button
                disabled={!canSwap}
                fullWidth
                size="large"
                variant="contained"
                onClick={onSubmitRequested}
              >
                Swap
              </Button>
              {!poolExists && poolPairSelected && (
                <Alert severity="error">
                  There is no pool available for this pair
                </Alert>
              )}
            </Box>
          </Paper>
        </Box>
        <Box>
          <Paper sx={{ padding: 6, minWidth: 400 }}>
            <Box alignItems={"center"} gap={1} textAlign="center">
              <Typography textAlign="center" variant="h6" component="h6">
                Wallets
              </Typography>

              {!client.ctx.isSignedIn() ? (
                <Box>No wallet connected. Please connect a wallet.</Box>
              ) : (
                <Table>
                  {balances.map((balance) => (
                    <TableRow key={balance.address}>
                      <TableCell>{balance.symbol}</TableCell>
                      <TableCell align="right">
                        {toFormat(balance.balance, balance.decimals)}
                      </TableCell>
                    </TableRow>
                  ))}
                </Table>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
      {/* modals */}
      {tokenFrom.asset && tokenTo.asset && (
        <SwapPreviewModal
          open={state.value === States.PREVIEW}
          fromAmount={tokenFrom.amount}
          fromAsset={tokenFrom.asset}
          toAmount={tokenTo.amount}
          toAsset={tokenTo.asset}
          handleClose={onCancelRequested}
          handleSubmit={onSubmitRequested}
        />
      )}
      <SwapProcessModal open={state.matches(States.PROCESS)} />
      <SwapErrorModal
        error={state.matches(States.ERROR) ? state.context.error : ""}
        open={state.matches(States.ERROR)}
        onClose={onCancelRequested}
      />
      <SwapSuccessModal
        open={state.matches(States.DONE)}
        onClose={onCancelRequested}
      />
    </>
  );
  //    <pre>
  //    {JSON.stringify(
  //      swapProps,
  //      (key, value) =>
  //        typeof value === "bigint" ? value.toString() + "n" : value,
  //      2
  //    )}
  //  </pre>
}
