import { FC } from 'react';
import Modal from '../../../../components/modal';
import Content from './content';
import { Asset } from "../../../../interfaces";

interface ConfirmSwapModalProps {
    open: boolean;
    onClose(): void;
    fromAsset: Asset;
    fromAmount: number;
    toAsset: Asset;
    toAmount: number;
    swapRate: number;
    slippage: string;
    onApprove(): void;
}

const ConfirmSwapModal: FC<ConfirmSwapModalProps> = ({ open, onClose, fromAsset, fromAmount, toAsset, toAmount, swapRate, slippage, onApprove }) => (
    <Modal
        content={<Content fromAsset={fromAsset} fromAmount={fromAmount} toAsset={toAsset} toAmount={toAmount} swapRate={swapRate} slippage={slippage} onApprove={onApprove} />}
        open={open}
        onClose={onClose}
    />
)

export default ConfirmSwapModal;