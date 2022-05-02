import { FC } from "react";

import Modal from "../../../../../components/modal";
import Content from "./content";
import { Asset } from "../../../../../types";

interface WithdrawLiquidityModalProps {
  open: boolean;
  onClose(): void;
  tokenA: Asset;
  tokenB: Asset;
}

const WithdrawLiquidityModal: FC<WithdrawLiquidityModalProps> = ({
  open,
  onClose,
  tokenA,
  tokenB,
}) => (
  <Modal
    content={<Content tokenAInit={tokenA} tokenBInit={tokenB} />}
    open={open}
    onClose={onClose}
  />
);

export default WithdrawLiquidityModal;
