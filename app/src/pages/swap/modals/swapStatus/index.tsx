import { FC } from "react";
import { StateValue } from "xstate";
import Modal from "../../../../components/modal";
import Content from "./content";
import { Asset } from "../../../../types";

interface SwapStatusModalProps {
  open: boolean;
  onClose(): void;
  fromAsset: Asset;
  fromAmount: bigint;
  toAsset: Asset;
  toAmount: bigint;
  state: StateValue;
}

const SwapStatusModal: FC<SwapStatusModalProps> = ({
  open,
  onClose,
  fromAsset,
  fromAmount,
  toAsset,
  toAmount,
  state,
}) => (
  <Modal
    content={
      <Content
        onClose={onClose}
        fromAsset={fromAsset}
        fromAmount={fromAmount}
        toAsset={toAsset}
        toAmount={toAmount}
        state={state}
      />
    }
    open={open}
    onClose={onClose}
  />
);

export default SwapStatusModal;
