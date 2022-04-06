#!/usr/bin/env bash
# execute from repo root:
# ~/hydra-protocol/ $ ./scripts/deploy.sh devnet
CLUSTER=$1

declare -a SKIPLIST=("hydra-staking hydra-benchmarks hydra-farming")
declare -a MAINNET_SKIPLIST=("hydra-faucet")

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
  anchor deploy --provider.cluster $CLUSTER --program-name $PROGRAM || exit 99
done
