import { Network, NetworkConfig, NetworkMap, ProgramIds } from "../types";
import HydraStakingIdl from "target/idl/hydra_staking.json";

const programIds: ProgramIds = {
  hydraStaking: HydraStakingIdl.metadata.address,
  redeemableMint: "",
  tokenMint: "",
};

// This may be loaded async or be a JSON eventually
const ConfigByNetwork: NetworkMap = {
  localnet: {
    programIds,
  },

  mainnet: {
    programIds,
  },

  testnet: {
    programIds,
  },

  devnet: {
    programIds,
  },
};

export function getProgramIds(connection: Network): ProgramIds {
  const { programIds } = ConfigByNetwork[connection];
  return programIds;
}
