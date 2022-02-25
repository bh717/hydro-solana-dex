import { Network, NetworkMap, ProgramIds } from "../types";
import GlobalConfig from "config-ts/global-config.json";

// This may be loaded async or be a JSON eventually
const ConfigByNetwork: NetworkMap = GlobalConfig;

export function getProgramIds(connection: Network): ProgramIds {
  const { programIds } = ConfigByNetwork[connection];
  return programIds;
}
