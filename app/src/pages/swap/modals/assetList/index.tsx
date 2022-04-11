import { FC } from "react";

import Modal from "../../../../components/modal";
import Content from "./content";
import { Asset, AssetBalance } from "../../../../types";

interface AssetListModalProps {
  open: boolean;
  onClose(): void;
  assetList: Array<Asset>;
  setAsset(asset: Asset): void;
  balances: AssetBalance;
}

const AssetListModal: FC<AssetListModalProps> = ({
  open,
  onClose,
  assetList,
  setAsset,
  balances,
}) => (
  <Modal
    content={
      <Content assetList={assetList} setAsset={setAsset} balances={balances} />
    }
    open={open}
    onClose={onClose}
  />
);

export default AssetListModal;
