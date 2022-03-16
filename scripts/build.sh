#!/usr/bin/env bash
# execute from repo root:
# ~/hydra-protocol/ $ ./scripts/build.sh

set -x

# delete old build
rm -rf ./target/deploy/*.so

# remove old ts types
rm -rf ./sdks/types-ts/codegen/types/*.ts

# build new
anchor build $@

# process idl
yarn ts-node ./scripts/process-idl.ts
cd ./sdks/types-ts && yarn build