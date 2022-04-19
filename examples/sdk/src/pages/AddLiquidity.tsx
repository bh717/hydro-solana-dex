import { Paper, Stack, Typography, Button, Alert } from "@mui/material";
import PlusIcon from "@mui/icons-material/Add";
import { TokenField } from "../components/TokenField";
import { useAddLiquidity } from "../hooks/add-liquidity/useAddLiquidity";
import { AddLiquidityPreviewModal } from "../components/add-liquidity/AddLiquidityPreviewModal";
import { AddLiquidityProcessModal } from "../components/add-liquidity/AddLiquidityProcessModal";
import { AddLiquidityErrorModal } from "../components/add-liquidity/AddLiquidityErrorModal";
import { AddLiquiditySuccessModal } from "../components/add-liquidity/AddLiquiditySuccessModal";
import { Box } from "@mui/system";
import { Balances } from "./Balances";
import { States } from "../hooks/add-liquidity/useAddLiquidityUIState";
import { useSlippage } from "../hooks/useTokenForm";
import { SlippageSelector } from "../components/SlippageSelector";

type AddLiquidityProps = {
  tokenAInit?: string;
  tokenBInit?: string;
};

export function AddLiquidity({ tokenAInit, tokenBInit }: AddLiquidityProps) {
  // TODO: Extract slippage to global config
  const { slippage, setSlippage } = useSlippage();

  const {
    assetsTokenA,
    assetsTokenB,
    onSendCancel,
    onSendSubmit,
    setFocus,
    tokenA,
    tokenB,
    state,
    isSubmitDisabled,
    isInitialized,
    isValid,
  } = useAddLiquidity(slippage, tokenAInit, tokenBInit);

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
                  Add Liquidity
                </Typography>
                <Stack direction={"row"}>
                  <TokenField
                    token={tokenA}
                    onFocus={setFocus}
                    focusLabel="from"
                    assets={assetsTokenA}
                  />
                </Stack>
                <Box>
                  <PlusIcon />
                </Box>
                <Stack direction={"row"}>
                  <TokenField
                    focusLabel="to"
                    onFocus={setFocus}
                    token={tokenB}
                    assets={assetsTokenB}
                  />
                </Stack>

                <Button
                  disabled={isSubmitDisabled}
                  fullWidth
                  size="large"
                  variant="contained"
                  onClick={onSendSubmit}
                >
                  Add Liquidity
                </Button>

                {isValid && !isInitialized && (
                  <Alert severity="info">Pool is not initialized!</Alert>
                )}
              </Box>
            </Paper>
          </Box>

          <Balances />
        </Box>
        <SlippageSelector slippage={slippage} onSelected={setSlippage} />
      </Box>

      {/* modals */}
      {tokenA.asset && tokenB.asset && (
        <AddLiquidityPreviewModal
          open={state.matches(States.PREVIEW)}
          tokenAAmount={tokenA.amount}
          tokenAAsset={tokenA.asset}
          tokenBAmount={tokenB.amount}
          tokenBAsset={tokenB.asset}
          handleClose={onSendCancel}
          handleSubmit={onSendSubmit}
        />
      )}
      <AddLiquidityProcessModal open={state.matches(States.PROCESS)} />
      <AddLiquidityErrorModal
        error={state.matches(States.ERROR) ? state.context.error : ""}
        open={state.matches(States.ERROR)}
        onClose={onSendCancel}
      />
      <AddLiquiditySuccessModal
        open={state.matches(States.DONE)}
        onClose={onSendCancel}
      />
    </>
  );
}
