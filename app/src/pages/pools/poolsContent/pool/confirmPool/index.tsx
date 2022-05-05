import { FC } from "react";
import Modal from "../../../../../components/modal";
import Content from "./content";
import { Asset } from "../../../../../types";

interface ConfirmPoolModalProps {
  open: boolean;
  onClose(): void;
  assetA: Asset | undefined;
  assetAAmount: bigint;
  assetB: Asset | undefined;
  assetBAmount: bigint;
  onApprove(): void;
}

const ConfirmPoolModal: FC<ConfirmPoolModalProps> = ({
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

export default ConfirmPoolModal;
