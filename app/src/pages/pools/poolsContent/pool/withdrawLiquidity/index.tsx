import { FC } from "react";

import Modal from "../../../../../components/modal";
import Content from "./content";

interface WithdrawLiquidityModalProps {
  open: boolean;
  onClose(): void;
  percent: bigint;
  setPercent(value: bigint): void;
  isSubmitDisabled: boolean;
  onConfirm(): void;
}

const WithdrawLiquidityModal: FC<WithdrawLiquidityModalProps> = ({
  open,
  onClose,
  percent,
  setPercent,
  isSubmitDisabled,
  onConfirm,
}) => (
  <Modal
    content={
      <Content
        percent={percent}
        setPercent={setPercent}
        isSubmitDisabled={isSubmitDisabled}
        onConfirm={onConfirm}
      />
    }
    open={open}
    onClose={onClose}
  />
);

export default WithdrawLiquidityModal;
