import { Paper, Stack, Typography, Button } from "@mui/material";
import { Box } from "@mui/system";
import { Balances } from "./Balances";
import {
  RemoveLiquidityState,
  useSlippage,
  useRemoveLiquidity,
} from "hydra-react-ts";
import { SlippageSelector } from "../components/SlippageSelector";
import { RemoveLiquidityPreviewModal } from "../components/remove-liquidity/RemoveLiquidityPreviewModal";
import { RemoveLiquidityProcessModal } from "../components/remove-liquidity/RemoveLiquidityProcessModal";
import { RemoveLiquidityErrorModal } from "../components/remove-liquidity/RemoveLiquidityErrorModal";
import { RemoveLiquiditySuccessModal } from "../components/remove-liquidity/RemoveLiquiditySuccessModal";
import { AssetSelector } from "../components/AssetSelector";
import { NumericField } from "../components/NumericField";

type RemoveLiquidityProps = {
  tokenAInit?: string;
  tokenBInit?: string;
};

export function RemoveLiquidity({
  tokenAInit,
  tokenBInit,
}: RemoveLiquidityProps) {
  // TODO: Extract slippage to global config
  const { slippage, setSlippage } = useSlippage();

  const {
    tokenA,
    tokenB,
    assetsTokenA,
    assetsTokenB,
    onSendCancel,
    onSendSubmit,
    isSubmitDisabled,
    state,
    percent,
    setPercent,
  } = useRemoveLiquidity(tokenAInit, tokenBInit);

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
                  Remove Liquidity
                </Typography>
                <Stack direction={"row"} justifyContent="space-between">
                  <AssetSelector
                    selected={tokenA.asset}
                    assets={assetsTokenA}
                    onChange={tokenA.setAsset}
                  />{" "}
                  <AssetSelector
                    selected={tokenB.asset}
                    assets={assetsTokenB}
                    onChange={tokenB.setAsset}
                  />
                </Stack>
                <NumericField
                  fullWidth={true}
                  value={Number(percent) / 100}
                  onChange={(num) => setPercent(BigInt(num * 100))}
                />

                <Stack direction={"row"} justifyContent="space-between">
                  <Button onClick={() => setPercent(2500n)}>25%</Button>
                  <Button onClick={() => setPercent(5000n)}>50%</Button>
                  <Button onClick={() => setPercent(7500n)}>75%</Button>
                  <Button onClick={() => setPercent(10000n)}>100%</Button>
                </Stack>

                <Button
                  disabled={isSubmitDisabled}
                  fullWidth
                  size="large"
                  variant="contained"
                  onClick={onSendSubmit}
                >
                  Remove Liquidity
                </Button>
              </Box>
            </Paper>
          </Box>

          <Balances />
        </Box>
        <SlippageSelector slippage={slippage} onSelected={setSlippage} />
      </Box>

      {/* modals */}
      {tokenA.asset && tokenB.asset && (
        <RemoveLiquidityPreviewModal
          open={state.matches(RemoveLiquidityState.PREVIEW)}
          tokenAAsset={tokenA.asset}
          tokenBAsset={tokenB.asset}
          percent={percent}
          handleClose={onSendCancel}
          handleSubmit={onSendSubmit}
        />
      )}
      <RemoveLiquidityProcessModal
        open={state.matches(RemoveLiquidityState.PROCESS)}
      />
      <RemoveLiquidityErrorModal
        error={
          state.matches(RemoveLiquidityState.ERROR) ? state.context.error : ""
        }
        open={state.matches(RemoveLiquidityState.ERROR)}
        onClose={onSendCancel}
      />
      <RemoveLiquiditySuccessModal
        open={state.matches(RemoveLiquidityState.DONE)}
        onClose={onSendCancel}
      />
    </>
  );
}
