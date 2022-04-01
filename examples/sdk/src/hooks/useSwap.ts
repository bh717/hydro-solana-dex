import { useTokenForm } from "./useTokenForm";
import { usePool } from "./usePool";
import { useLiquidityPoolAccounts } from "./useLiquidityPoolAccounts";
import { useHydraClient } from "../components/HydraClientProvider";
import { createMachine, assign } from "xstate";
import { useMachine } from "@xstate/react";
import { useCallback, useEffect } from "react";
import { AccountData } from "hydra-ts/src/utils/account-loader";
import { TokenMint } from "hydra-ts/src/types/token-mint";
import { useSwapCommands } from "./useSwapCommands";
import { useCalculateSwapResult } from "./useCalculateSwapResult";

export enum States {
  EDIT = "edit",
  PREVIEW = "preview",
  PROCESS = "process",
  ERROR = "error",
  DONE = "done",
}

type XContext = {
  error?: string;
};

type XEvents =
  | { type: "SUBMIT" }
  | { type: "CANCEL" }
  | { type: "SUCCESS" }
  | { type: "FAIL"; error: string };

type XTypestate =
  | {
      value: "edit";
      context: XContext;
    }
  | {
      value: "preview";
      context: XContext;
    }
  | {
      value: "process";
      context: XContext;
    }
  | {
      value: "error";
      context: XContext & { error: string };
    }
  | {
      value: "done";
      context: XContext;
    };

const swapMachine = createMachine<XContext, XEvents, XTypestate>({
  id: "swap_flow",
  initial: "edit",
  context: {},
  states: {
    edit: {
      on: {
        SUBMIT: "preview",
      },
    },
    preview: {
      on: {
        SUBMIT: "process",
        CANCEL: "edit",
      },
    },
    process: {
      entry: ["swap"],
      on: {
        SUCCESS: "done",
        FAIL: "error",
      },
    },
    error: {
      entry: ["updateEvent"],
      on: {
        CANCEL: "edit",
      },
    },
    done: {
      on: {
        CANCEL: "edit",
      },
    },
  },
});

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
  const tokenFormProps = useTokenForm(sdk);
  const accounts = useLiquidityPoolAccounts(
    sdk,
    tokenFormProps.tokenXMint,
    tokenFormProps.tokenYMint
  );
  const { tokenFrom, tokenTo, focus } = tokenFormProps;
  const pool = usePool(accounts);
  const { executeSwap } = useSwapCommands(sdk, tokenFormProps);

  useCalculateSwapResult(sdk, pool, tokenFrom, tokenTo, focus);

  const [state, send] = useMachine(swapMachine, {
    actions: {
      async swap() {
        try {
          await executeSwap();
          send("SUCCESS");
        } catch (error) {
          send("FAIL", { error: `${error}` });
        }
      },
      updateEvent: assign((_, event) =>
        event.type === "FAIL"
          ? {
              error: event.error,
            }
          : {}
      ),
    },
  });

  const onSubmitRequested = useCallback(() => {
    send("SUBMIT");
  }, [send]);

  const onCancelRequested = useCallback(() => {
    send("CANCEL");
  }, [send]);

  // boolleans
  const poolExists = !!pool.poolState;
  const poolPairSelected =
    tokenFormProps.tokenFrom.asset && tokenFormProps.tokenTo.asset;

  const canSwap = poolExists && sdk.ctx.isSignedIn();

  return {
    ...pool,
    ...tokenFormProps,
    poolPairSelected,
    poolExists,
    canSwap,
    onSubmitRequested,
    onCancelRequested,
    setFocus: tokenFormProps.setFocus,
    state,
  };
}
