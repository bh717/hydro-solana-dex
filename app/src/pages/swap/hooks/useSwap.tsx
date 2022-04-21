import { useTokenForm } from "./useTokenForm";
import { usePool } from "./usePool";
import { useHydraClient } from "../../../components/hydraClientProvider";
import { AccountData } from "hydra-ts";
import { TokenMint } from "hydra-ts/src/types/token-mint";
import { useCreateSwapCommand } from "./useCreateSwapCommand";
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

  // get form data and controls
  const {
    assetsTokenFrom,
    assetsTokenTo,
    focus,
    setFocus,
    toggleFields,
    tokenFrom,
    tokenTo,
    tokenXMint,
    tokenYMint,
  } = useTokenForm();

  // get pool values
  const pool = usePool(sdk, tokenXMint, tokenYMint);

  // set reactive form fields based on input
  useCalculateSwapResult(sdk, pool, tokenFrom, tokenTo, focus);

  // get modal state and handlers
  const { onSendSubmit, onSendCancel, state } = useSwapUIState(
    useCreateSwapCommand(sdk, tokenFrom, tokenTo, tokenXMint, tokenYMint)
  );

  // get booleans for interface
  const poolExists = !!pool.poolState;
  const poolPairSelected = tokenFrom.asset && tokenTo.asset;
  const canSwap = poolExists && sdk.ctx.isSignedIn();

  // Send it all down
  return {
    ...pool,
    assetsTokenFrom,
    assetsTokenTo,
    canSwap,
    focus,
    onSendCancel,
    onSendSubmit,
    poolExists,
    poolPairSelected,
    setFocus,
    state,
    toggleFields,
    tokenFrom,
    tokenTo,
    tokenXMint,
    tokenYMint,
  };
}
