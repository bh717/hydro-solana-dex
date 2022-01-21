import { FC } from 'react';

import Modal from '../../../../components/modal';
import Content from './content';
import { RPC } from '../../../../interfaces';

interface SelectRPCModalProps {
    open: boolean;
    onClose(): void;
    rpc: RPC;
    changeRPC(value: RPC): void;
    networks: Array<RPC>;
}

const SelectRPCModal: FC<SelectRPCModalProps> = ({ open, onClose, rpc, changeRPC, networks }) => (
    <Modal
        content={<Content data={rpc} setData={changeRPC} networks={networks} />}
        open={open}
        onClose={onClose}
    />
)

export default SelectRPCModal;