import { FC } from "react";

import Modal from "../../../../components/modal";
import Content from "./content";
import { Asset } from "../../../../interfaces";

interface AssetListModalProps {
  open: boolean;
  onClose(): void;
  assetList: Array<Asset>;
  setAsset(asset: Asset): void;
}

const AssetListModal: FC<AssetListModalProps> = ({
  open,
  onClose,
  assetList,
  setAsset,
}) => (
  <Modal
    content={<Content assetList={assetList} setAsset={setAsset} />}
    open={open}
    onClose={onClose}
  />
);

export default AssetListModal;
