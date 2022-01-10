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
}

const ConfirmSwapModal: FC<ConfirmSwapModalProps> = ({ open, onClose, fromAsset, fromAmount, toAsset, toAmount, swapRate, slippage }) => (
    <Modal
        content={<Content fromAsset={fromAsset} fromAmount={fromAmount} toAsset={toAsset} toAmount={toAmount} swapRate={swapRate} slippage={slippage} />}
        open={open}
        onClose={onClose}
    />
)

export default ConfirmSwapModal;