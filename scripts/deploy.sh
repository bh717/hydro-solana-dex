#!/usr/bin/env bash
# execute from repo root:
# ~/hydra-protocol/ $ ./scripts/deploy.sh devnet $SOLANA_KEY
set -x
CLUSTER=$1
KEY=$2

declare -a SKIPLIST=("hydra-staking hydra-benchmarks hydra-farming")
declare -a MAINNET_SKIPLIST=("hydra-faucet")

echo $KEY > /tmp/key.json

INITIAL_SOLANA_VERSION=$(solana -V | awk '{print $2}')
# This version is needed due to a deploy issue with newer versions of the solana cli
solana-install-init 1.8.16
solana -V
solana airdrop 2 -k /tmp/key.json || true

anchor build -- --features $CLUSTER

echo "Deploying to: $CLUSTER"
for D in ./programs/*/; do
  read PROGRAM <<<$(echo ${D} | awk '{ split($0,x,"/"); print x[3] }')

  # skip any programs listed in the $SKIPLIST
  for SKIP in $SKIPLIST; do
    if [[ $PROGRAM == $SKIP ]]; then
      echo "Skipping: $SKIP"
      continue 2
    fi
  done

  # skip any program listed in the $MAINNET_SKIPLIST when the $CLUSTER is mainnet
  if [[ $CLUSTER == "mainnet" ]]; then
    for SKIP in $MAINNET_SKIPLIST; do
      if [[ $PROGRAM == $SKIP ]]; then
        echo "Skipping: $SKIP"
        continue 2
      fi
    done
  fi

  echo "Deploying: $PROGRAM"
  anchor deploy --provider.cluster $CLUSTER --program-name $PROGRAM --provider.wallet /tmp/key.json || exit 99
done

rm /tmp/key.json
solana-install-init $INITIAL_SOLANA_VERSION
