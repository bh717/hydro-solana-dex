import { FC } from "react";
import Modal from "../../../../components/modal";
import Content from "./content";

interface SwapSettingModalProps {
  open: boolean;
  onClose(): void;
  slippage: bigint;
  setSlippage(value: bigint): void;
}

const SwapSettingModal: FC<SwapSettingModalProps> = ({
  open,
  onClose,
  slippage,
  setSlippage,
}) => (
  <Modal
    content={<Content slippage={slippage} setSlippage={setSlippage} />}
    open={open}
    onClose={onClose}
  />
);

export default SwapSettingModal;
