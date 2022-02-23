#!/usr/bin/env bash
# execute from repo root:
# ~/hydra-protocol/ $ ./scripts/build.sh

set -x

# delete old build
rm -rf ./target/deploy/*.so

# remove old ts types
rm -rf ./sdks/hydra-ts/codegen/types/*.ts

# build new
anchor build -- --features "localnet"

# copy new
cp ./target/types/*.ts ./sdks/hydra-ts/codegen/types

# process new codegen and types files.

# TODO Remove reserve from ts types file