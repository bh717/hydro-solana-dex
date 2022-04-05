import { Paper, Stack, Typography, Button, Alert } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import { TokenField } from "../components/TokenField";
import { useSwap } from "../hooks/useSwap";
import { SwapPreviewModal } from "../components/SwapPreviewModal";
import { SwapProcessModal } from "../components/SwapProcessModal";
import { SwapErrorModal } from "../components/SwapErrorModal";
import { SwapSuccessModal } from "../components/SwapSuccessModal";
import { Box } from "@mui/system";
import { Balances } from "./Balances";
import { States } from "../hooks/useSwapUIState";

export function Swap() {
  const {
    tokenFrom,
    tokenTo,
    assetsTokenFrom,
    assetsTokenTo,
    toggleFields,
    poolExists,
    poolPairSelected,
    canSwap,
    setFocus,
    onSendSubmit,
    state,
    onSendCancel,
  } = useSwap();

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
                disabled={!canSwap}
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
      {/* modals */}
      {tokenFrom.asset && tokenTo.asset && (
        <SwapPreviewModal
          open={state.value === States.PREVIEW}
          fromAmount={tokenFrom.amount}
          fromAsset={tokenFrom.asset}
          toAmount={tokenTo.amount}
          toAsset={tokenTo.asset}
          handleClose={onSendCancel}
          handleSubmit={onSendSubmit}
        />
      )}
      <SwapProcessModal open={state.matches(States.PROCESS)} />
      <SwapErrorModal
        error={state.matches(States.ERROR) ? state.context.error : ""}
        open={state.matches(States.ERROR)}
        onClose={onSendCancel}
      />
      <SwapSuccessModal
        open={state.matches(States.DONE)}
        onClose={onSendCancel}
      />
    </>
  );
}
