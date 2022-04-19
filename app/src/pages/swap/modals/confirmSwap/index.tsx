import { FC } from "react";
import Modal from "../../../../components/modal";
import Content from "./content";
import { Asset } from "../../../../types";

interface ConfirmSwapModalProps {
  open: boolean;
  onClose(): void;
  fromAsset: Asset;
  fromAmount: bigint;
  toAsset: Asset;
  toAmount: bigint;
  onApprove(): void;
}

const ConfirmSwapModal: FC<ConfirmSwapModalProps> = ({
  open,
  onClose,
  fromAsset,
  fromAmount,
  toAsset,
  toAmount,
  onApprove,
}) => (
  <Modal
    content={
      <Content
        fromAsset={fromAsset}
        fromAmount={fromAmount}
        toAsset={toAsset}
        toAmount={toAmount}
        onApprove={onApprove}
      />
    }
    open={open}
    onClose={onClose}
  />
);

export default ConfirmSwapModal;
