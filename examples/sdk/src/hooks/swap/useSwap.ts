import { useTokenForm } from "../useTokenForm";
import { usePoolStream } from "../usePoolStream";
import { useHydraClient } from "../../components/HydraClientProvider";
import { useCreateSwapCommand } from "./useCreateSwapCommand";
import { useCalculateSwapResult } from "./useCalculateSwapResult";
import { useSwapUIState } from "./useSwapUIState";

export function useSwap(slippage: bigint) {
  const sdk = useHydraClient();

  // get form data and controls
  const {
    assetsTokenA: assetsTokenFrom,
    assetsTokenB: assetsTokenTo,
    focus,
    setFocus,
    toggleFields,
    tokenA: tokenFrom,
    tokenB: tokenTo,
  } = useTokenForm();

  // get pool values
  const pool = usePoolStream(sdk, tokenFrom.mint, tokenTo.mint);

  // set reactive form fields based on input
  useCalculateSwapResult(sdk, pool, tokenFrom, tokenTo, focus);

  // get modal state and handlers
  const minimumAmountOut = (tokenTo.amount * (10_000n - slippage)) / 10_000n;

  const commands = useCreateSwapCommand(
    sdk,
    tokenFrom,
    tokenTo,
    minimumAmountOut
  );
  const { onSendSubmit, onSendCancel, state } = useSwapUIState(commands);

  // get booleans for interface
  const poolExists = !!pool.poolState;
  const poolPairSelected = tokenFrom.asset && tokenTo.asset;
  const isSubmitDisabled = !(poolExists && sdk.ctx.isSignedIn());

  // Send it all down
  return {
    ...pool,
    assetsTokenFrom,
    assetsTokenTo,
    isSubmitDisabled,
    focus,
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
  };
}
