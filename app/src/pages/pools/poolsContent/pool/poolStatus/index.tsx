import { FC } from "react";
import { StateValue } from "xstate";
import Modal from "../../../../../components/modal";
import Content from "./content";
import { Asset } from "../../../../../types";

interface PoolStatusModalProps {
  open: boolean;
  onClose(): void;
  assetA: Asset | undefined;
  assetAAmount: bigint;
  assetB: Asset | undefined;
  assetBAmount: bigint;
  state: StateValue;
}

const PoolStatusModal: FC<PoolStatusModalProps> = ({
  open,
  onClose,
  assetA,
  assetAAmount,
  assetB,
  assetBAmount,
  state,
}) => (
  <Modal
    content={
      <Content
        onClose={onClose}
        assetA={assetA}
        assetAAmount={assetAAmount}
        assetB={assetB}
        assetBAmount={assetBAmount}
        state={state}
      />
    }
    open={open}
    onClose={onClose}
  />
);

export default PoolStatusModal;
