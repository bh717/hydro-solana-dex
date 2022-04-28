import { FC } from "react";

import Modal from "../../../../../components/modal";
import Content from "./content";
import { Asset } from "../../../../../types";

interface DepositLiquidityModalProps {
  open: boolean;
  onClose(): void;
  tokenA: Asset;
  tokenB: Asset;
}

const DepositLiquidityModal: FC<DepositLiquidityModalProps> = ({
  open,
  onClose,
  tokenA,
  tokenB,
}) => (
  <Modal
    content={<Content tokenA={tokenA} tokenB={tokenB} />}
    open={open}
    onClose={onClose}
    size="lg"
  />
);

export default DepositLiquidityModal;
