import { FC } from "react";

import Modal from "../../../../../components/modal";
import Content from "./content";

interface WithdrawLiquidityModalProps {
  open: boolean;
  onClose(): void;
}

const WithdrawLiquidityModal: FC<WithdrawLiquidityModalProps> = ({
  open,
  onClose,
}) => <Modal content={<Content />} open={open} onClose={onClose} />;

export default WithdrawLiquidityModal;
