import { useTokenForm } from "./useTokenForm";
import { usePool } from "./usePool";
import { useHydraClient } from "../components/HydraClientProvider";
import { AccountData } from "hydra-ts/src/utils/account-loader";
import { TokenMint } from "hydra-ts/src/types/token-mint";
import { useSwapCommands } from "./useSwapCommands";
import { useCalculateSwapResult } from "./useCalculateSwapResult";
import { useSwapModalState } from "./useSwapModalState";

export function getDirection(
  tokenXMint: AccountData<TokenMint>,
  tokenYMint: AccountData<TokenMint>,
  address: string
): "xy" | "yx" | null {
  return `${tokenXMint.pubkey}` === address
    ? "xy"
    : `${tokenYMint.pubkey}`
    ? "yx"
    : null;
}

export function useSwap() {
  const sdk = useHydraClient();

  // keep all token stuff together to pass to dependencies
  const tokenForm = useTokenForm(sdk);

  // get form data and controls
  const { tokenFrom, tokenTo, focus, tokenXMint, tokenYMint } = tokenForm;

  // get commands
  const { executeSwap } = useSwapCommands(sdk, tokenForm);

  // get pool values
  const pool = usePool(sdk, tokenXMint, tokenYMint);

  // set reactive form fields based on input
  useCalculateSwapResult(sdk, pool, tokenFrom, tokenTo, focus);

  // get modal state and handlers
  const { onSendSubmit, onSendCancel, state } = useSwapModalState(executeSwap);

  // get booleans for interface
  const poolExists = !!pool.poolState;
  const poolPairSelected = tokenForm.tokenFrom.asset && tokenForm.tokenTo.asset;
  const canSwap = poolExists && sdk.ctx.isSignedIn();

  // Send it all down
  return {
    ...pool,
    ...tokenForm,
    poolPairSelected,
    poolExists,
    canSwap,
    setFocus: tokenForm.setFocus,
    onSendSubmit,
    onSendCancel,
    state,
  };
}
