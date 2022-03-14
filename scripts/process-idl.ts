import HydraStaking from "target/idl/hydra_staking.json";
import HydraBenchmarks from "target/idl/hydra_benchmarks.json";
import HydraFarming from "target/idl/hydra_farming.json";
import HydraLiquidityPools from "target/idl/hydra_liquidity_pools.json";
import { pascalCase } from "pascal-case";

import fs from "fs";

export function generateTemplate(idl: { name: string }) {
  const name = pascalCase(idl.name);

  return `
export type ${name} = ${JSON.stringify(idl, null, 2)};

export const IDL: ${name} = ${JSON.stringify(idl, null, 2)};
`;
}

function modifyHydraLiquidityPools(a: typeof HydraLiquidityPools) {
  try {
    const accounts = a.accounts;
    const poolStateIndex = accounts
      .map(({ name }) => name)
      .indexOf("PoolState");
    const fields = accounts[poolStateIndex].type.fields;
    const fieldsIndex = fields
      .map(({ type }) => (typeof type === "string" ? type : type.defined))
      .indexOf("PoolStateReserve");

    a.accounts[poolStateIndex].type.fields.splice(fieldsIndex, 1);
  } catch (err) {}
  return a;
}

async function main() {
  const hydraBenchmarks = generateTemplate(HydraBenchmarks);
  const hydraLiquidityPools = generateTemplate(
    modifyHydraLiquidityPools(HydraLiquidityPools)
  );
  const hydraStaking = generateTemplate(HydraStaking);
  const hydraFarming = generateTemplate(HydraFarming);

  fs.writeFileSync(
    "./sdks/types-ts/codegen/types/hydra_benchmarks.ts",
    hydraBenchmarks
  );
  fs.writeFileSync(
    "./sdks/types-ts/codegen/types/hydra_farming.ts",
    hydraFarming
  );
  fs.writeFileSync(
    "./sdks/types-ts/codegen/types/hydra_liquidity_pools.ts",
    hydraLiquidityPools
  );
  fs.writeFileSync(
    "./sdks/types-ts/codegen/types/hydra_staking.ts",
    hydraStaking
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
