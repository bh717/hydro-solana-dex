#!/bin/sh

set -e

wasm-pack build -d .pkg/web --target web --out-name index
wasm-pack build -d .pkg/node --target nodejs --out-name index 
rm .pkg/node/package.json 
rm .pkg/web/package.json