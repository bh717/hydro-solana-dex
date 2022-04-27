import { FC } from "react";

import Modal from "../../../../components/modal";
import Content from "./content";

interface SelectRPCModalProps {
  open: boolean;
  onClose(): void;
}

const SelectRPCModal: FC<SelectRPCModalProps> = ({ open, onClose }) => (
  <Modal content={<Content />} open={open} onClose={onClose} />
);

export default SelectRPCModal;
