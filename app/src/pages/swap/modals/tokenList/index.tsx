import { FC } from 'react';

import Modal from '../../../../components/modal';
import Content from './content';
import { Asset } from '../../../../interfaces';

interface TokenListModalProps {
    open: boolean;
    onClose(): void;
    assetList: Array<Asset>;
    setAsset(asset: Asset): void;
}

const TokenListModal: FC<TokenListModalProps> = ({ open, onClose, assetList, setAsset }) => (
    <Modal
        title="Select a token"
        content={<Content assetList={assetList} setAsset={setAsset} />}
        open={open}
        onClose={onClose}
    />   
)

export default TokenListModal;