import { Paper, Stack, Typography, Button, Alert } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import { TokenField } from "../components/TokenField";
import { useSwap, SwapState, useSlippage } from "hydra-react-ts";
import { SwapPreviewModal } from "../components/swap-modal/SwapPreviewModal";
import { SwapProcessModal } from "../components/swap-modal/SwapProcessModal";
import { SwapErrorModal } from "../components/swap-modal/SwapErrorModal";
import { SwapSuccessModal } from "../components/swap-modal/SwapSuccessModal";
import { Box } from "@mui/system";
import { Balances } from "./Balances";
import { SlippageSelector } from "../components/SlippageSelector";

export function Swap() {
  // TODO: Extract slippage to global config
  const { slippage, setSlippage } = useSlippage();

  const {
    assetsTokenFrom,
    assetsTokenTo,
    isSubmitDisabled,
    minimumAmountOut,
    onSendCancel,
    onSendSubmit,
    poolExists,
    poolPairSelected,
    setFocus,
    state,
    toggleFields,
    tokenFrom,
    tokenTo,
  } = useSwap(slippage);

  return (
    <>
      <Box flexDirection={"column"} display="flex" gap={2}>
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
                  <TokenField
                    token={tokenFrom}
                    onFocus={setFocus}
                    focusLabel="from"
                    assets={assetsTokenFrom}
                  />
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
                  <TokenField
                    focusLabel="to"
                    onFocus={setFocus}
                    token={tokenTo}
                    assets={assetsTokenTo}
                  />
                </Stack>

                <Button
                  disabled={isSubmitDisabled}
                  fullWidth
                  size="large"
                  variant="contained"
                  onClick={onSendSubmit}
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

          <Balances />
        </Box>
        <SlippageSelector slippage={slippage} onSelected={setSlippage} />
      </Box>

      {/* modals */}
      {tokenFrom.asset && tokenTo.asset && (
        <SwapPreviewModal
          open={state.value === SwapState.PREVIEW}
          fromAmount={tokenFrom.amount}
          fromAsset={tokenFrom.asset}
          toAmount={tokenTo.amount}
          toAsset={tokenTo.asset}
          handleClose={onSendCancel}
          handleSubmit={onSendSubmit}
          minimumAmountOut={minimumAmountOut}
        />
      )}
      <SwapProcessModal open={state.matches(SwapState.PROCESS)} />
      <SwapErrorModal
        error={state.matches(SwapState.ERROR) ? state.context.error : ""}
        open={state.matches(SwapState.ERROR)}
        onClose={onSendCancel}
      />
      <SwapSuccessModal
        open={state.matches(SwapState.DONE)}
        onClose={onSendCancel}
      />
    </>
  );
}
