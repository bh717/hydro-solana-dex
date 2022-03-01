import { FC } from "react";

import Modal from "../../modal";
import Content from "./content";

interface WalletModalProps {
  open: boolean;
  onClose(): void;
  address: string;
}

const WalletModal: FC<WalletModalProps> = ({ open, onClose, address }) => (
  <Modal
    content={<Content address={address} />}
    open={open}
    onClose={onClose}
  />
);

export default WalletModal;
