#!/usr/bin/env bash
# execute from repo root:
# ~/hydra-protocol/ $ ./scripts/build.sh

set -x

# delete old build
rm -rf ./target/deploy/*.so

# remove old ts types
rm -rf ./sdks/types-ts/codegen/types/*.ts

# build new
anchor build -- --features "localnet"

# copy new
# cp ./target/types/*.ts ./sdks/types-ts/codegen/types

yarn ts-node ./scripts/process-idl.ts

# yarn ts-node ./scripts/process-idl.ts \
#   --input ./target/idl/hydra_liquidity_pools.json \
#   --output ./sdks/types-ts/codegen/types/hydra_liquidity_pools.ts

# yarn ts-node ./scripts/process-idl.ts \
#   --input ./target/idl/hydra_liquidity_pools.json \
#   --output ./sdks/types-ts/codegen/types/hydra_liquidity_pools.ts


# process new codegen and types files.

# TODO Remove reserve from ts types file