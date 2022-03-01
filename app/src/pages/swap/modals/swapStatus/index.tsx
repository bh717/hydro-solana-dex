import { FC } from "react";
import Modal from "../../../../components/modal";
import Content from "./content";

interface SwapStatusModalProps {
  open: boolean;
  onClose(): void;
}

const SwapStatusModal: FC<SwapStatusModalProps> = ({ open, onClose }) => (
  <Modal
    content={<Content onClose={onClose} />}
    open={open}
    onClose={onClose}
  />
);

export default SwapStatusModal;
