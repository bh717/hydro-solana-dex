import { assign, createMachine } from "xstate";
import { useMachine } from "@xstate/react";
import { useCallback } from "react";

export enum RemoveLiquidityState {
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

export const machine = createMachine<XContext, XEvents, XTypestate>({
  id: "remove_liquidity_flow",
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
      entry: ["removeLiquidity"],
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

// take commands and return controls for a statemachine that represents the flow of the UI
export function useRemoveLiquidityUIState(impl: {
  executeRemoveLiquidity: () => Promise<void>;
}) {
  const [state, send] = useMachine(machine, {
    actions: {
      async removeLiquidity() {
        try {
          await impl.executeRemoveLiquidity();
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

  const onSendSubmit = useCallback(() => {
    send("SUBMIT");
  }, [send]);

  const onSendCancel = useCallback(() => {
    send("CANCEL");
  }, [send]);

  return {
    onSendCancel,
    onSendSubmit,
    state,
  };
}
