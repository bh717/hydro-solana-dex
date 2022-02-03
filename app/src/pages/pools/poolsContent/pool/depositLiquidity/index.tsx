import { FC } from 'react';

import Modal from '../../../../../components/modal';
import Content from './content';

interface DepositLiquidityModalProps {
    open: boolean;
    onClose(): void;
}

const DepositLiquidityModal: FC<DepositLiquidityModalProps> = ({ open, onClose }) => (
    <Modal
        content={<Content />}
        open={open}
        onClose={onClose}
        size="lg"
    />
)

export default DepositLiquidityModal;