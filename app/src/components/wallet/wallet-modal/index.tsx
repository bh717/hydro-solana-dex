import { FC } from 'react';

import Modal from '../../modal';
import Content from './content';

interface WalletModalProps {
    open: boolean;
    onClose(): void;
}

const WalletModal: FC<WalletModalProps> = ({ open, onClose }) => (
    <Modal
        content={<Content />}
        open={open}
        onClose={onClose}
    />
)

export default WalletModal;