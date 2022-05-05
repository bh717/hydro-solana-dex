import { FC } from "react";
import Modal from "../../../../../components/modal";
import Content from "./content";
import { Asset } from "../../../../../types";

interface DepositConfirmModalProps {
  open: boolean;
  onClose(): void;
  assetA: Asset | undefined;
  assetAAmount: bigint;
  assetB: Asset | undefined;
  assetBAmount: bigint;
  onApprove(): void;
}

const DepositConfirmModal: FC<DepositConfirmModalProps> = ({
  open,
  onClose,
  assetA,
  assetAAmount,
  assetB,
  assetBAmount,
  onApprove,
}) => (
  <Modal
    content={
      <Content
        assetA={assetA}
        assetAAmount={assetAAmount}
        assetB={assetB}
        assetBAmount={assetBAmount}
        onApprove={onApprove}
      />
    }
    open={open}
    onClose={onClose}
  />
);

export default DepositConfirmModal;
