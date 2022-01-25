import { FC } from 'react';
import Modal from '../../../../../components/modal';
import Content from './content';

interface MobileSortModalProps {
    open: boolean;
    onClose(): void;
}

const MobileSortModal: FC<MobileSortModalProps> = ({ open, onClose }) => (
    <Modal
        content={<Content />}
        open={open}
        onClose={onClose}
    />
)

export default MobileSortModal;