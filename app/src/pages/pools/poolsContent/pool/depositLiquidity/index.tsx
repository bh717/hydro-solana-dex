import { FC } from "react";

import Modal from "../../../../../components/modal";
import Content from "./content";

interface DepositLiquidityModalProps {
  open: boolean;
  onClose(): void;
  tokenA: any;
  tokenB: any;
  setFocus(position: "from" | "to"): void;
  isSubmitDisabled: boolean;
  onConfirm(): void;
}

const DepositLiquidityModal: FC<DepositLiquidityModalProps> = ({
  open,
  onClose,
  tokenA,
  tokenB,
  setFocus,
  isSubmitDisabled,
  onConfirm,
}) => (
  <Modal
    content={
      <Content
        tokenA={tokenA}
        tokenB={tokenB}
        setFocus={setFocus}
        isSubmitDisabled={isSubmitDisabled}
        onConfirm={onConfirm}
      />
    }
    open={open}
    onClose={onClose}
    size="lg"
  />
);

export default DepositLiquidityModal;
