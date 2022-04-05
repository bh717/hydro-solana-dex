#!/usr/bin/env bash
# execute from repo root:
# ~/hydra-protocol/ $ ./scripts/run-soteria.sh

for d in ./programs/*/ ; do
  echo Scanning: $d
  cd $d
  soteria -analyzeAll . || exit 99
done


