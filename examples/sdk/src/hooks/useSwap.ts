import { useTokenForm } from "./useTokenForm";
import { usePool } from "./usePool";
import { useHydraClient } from "../components/HydraClientProvider";
import { AccountData } from "hydra-ts/src/utils/account-loader";
import { TokenMint } from "hydra-ts/src/types/token-mint";
import { useCommands } from "./useCommands";
import { useCalculateSwapResult } from "./useCalculateSwapResult";
import { useSwapUIState } from "./useSwapUIState";

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
  const tokenForm = useTokenForm();

  // get form data and controls
  const { tokenFrom, tokenTo, focus, tokenXMint, tokenYMint } = tokenForm;

  // get commands
  const commands = useCommands(sdk, tokenForm);

  // get pool values
  const pool = usePool(sdk, tokenXMint, tokenYMint);

  // set reactive form fields based on input
  useCalculateSwapResult(sdk, pool, tokenFrom, tokenTo, focus);

  // get modal state and handlers
  const { onSendSubmit, onSendCancel, state } = useSwapUIState(commands);

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
