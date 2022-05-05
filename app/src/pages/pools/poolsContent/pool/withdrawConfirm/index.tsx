import { FC } from "react";
import Modal from "../../../../../components/modal";
import Content from "./content";
import { Asset } from "../../../../../types";

interface WithdrawConfirmModalProps {
  open: boolean;
  onClose(): void;
  assetA: Asset;
  assetB: Asset;
  percent: bigint;
  onApprove(): void;
}

const WithdrawConfirmModal: FC<WithdrawConfirmModalProps> = ({
  open,
  onClose,
  assetA,
  assetB,
  percent,
  onApprove,
}) => (
  <Modal
    content={
      <Content
        assetA={assetA}
        assetB={assetB}
        percent={percent}
        onApprove={onApprove}
      />
    }
    open={open}
    onClose={onClose}
  />
);

export default WithdrawConfirmModal;
