import { useHydraClient } from "../../components/HydraClientProvider";
import { useRemoveLiquidityUIState } from "./useRemoveLiquidityUIState";
import { useCreateRemoveLiquidityCommands } from "./useCreateRemoveLiquidityCommands";
import { useState } from "react";
import { usePoolStream } from "../usePoolStream";
import { useTokenForm } from "../useTokenForm";

export function useRemoveLiquidity(tokenAInit?: string, tokenBInit?: string) {
  // get form data and controls
  const sdk = useHydraClient();
  const { assetsTokenA, assetsTokenB, tokenA, tokenB } = useTokenForm({
    tokenAInit,
    tokenBInit,
  });

  const [percent, setPercent] = useState(0n);

  const { lpTokenAssociatedAccount, tokenXMint, tokenYMint } = usePoolStream(
    sdk,
    tokenA.mint,
    tokenB.mint
  );

  // TODO: Calculate token amount estimate from K once calculate_x_y is
  //       refactored to support scaled decimals

  // get modal state and handlers
  const commands = useCreateRemoveLiquidityCommands(
    sdk,
    percent,
    lpTokenAssociatedAccount,
    tokenXMint?.pubkey,
    tokenYMint?.pubkey
  );

  const { onSendSubmit, onSendCancel, state } =
    useRemoveLiquidityUIState(commands);

  const lpTokenBalance = lpTokenAssociatedAccount?.account.data.amount ?? 0n;

  const hasLiquidityInPool = Boolean(lpTokenBalance > 0n);
  const isSubmitDisabled = false;
  return {
    assetsTokenA,
    assetsTokenB,
    lpTokenBalance,
    hasLiquidityInPool,
    isSubmitDisabled,
    onSendCancel,
    onSendSubmit,
    percent,
    setPercent,
    tokenA,
    tokenB,
    state,
  };
}
