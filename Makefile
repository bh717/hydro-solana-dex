.PHONY: list
SHELL := /bin/bash
_ROOT_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))

ANCHOR_VERSION?=0.23.0
SOLANA_VERSION?=1.9.14
DEPLOY_CLUSTER?=devnet
SOLANA_DEPLOY_KEY?=$(shell cat ~/.config/solana/id.json)

list:
	@awk -F: '/^[A-z]/ {print $$1}' Makefile | sort

install_dependencies: install_rust
install_dependencies: install_solana
install_dependencies: install_wasm_pack
install_dependencies: install_anchor_avm
install_dependencies: install_node
install_dependencies: install_yarn
install_dependencies: install_project_deps
install_dependencies: test

install_rust:
	rustup update || curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# this is the new official way to install anchor now.
install_anchor_avm:
	@avm use ${ANCHOR_VERSION} || cargo install --git https://github.com/project-serum/anchor avm --tag v${ANCHOR_VERSION} --locked --force && avm use ${ANCHOR_VERSION}

# used in ci
install_anchor:
	anchor -V || cargo install --git https://github.com/project-serum/anchor --tag v${ANCHOR_VERSION} anchor-cli --locked --force

# used in ci
install_solana:
	solana-install update || sh -c "$$(curl -sSfL https://release.solana.com/${SOLANA_VERSION}/install)"
	solana -V

install_wasm_pack:
	wasm-pack -V || cargo install wasm-pack

install_node:
	node --version || echo Direction can be found here: https://nodejs.org/en/

install_yarn:
	yarn --version || echo Direction can be found here: https://yarnpkg.com/getting-started/install

install_soteria:
	mkdir -p ~/.soteria
	cd ~/.soteria && curl -k https://supercompiler.xyz/install | sh
	echo Please update your PATH to the following:
	echo export PATH=~/.soteria/soteria-linux-develop/bin/:$PATH

install_project_deps:
	yarn
	make build

# build ie types, sdk, anchor
build:
	./scripts/build.sh
	yarn turbo run build

test: build
	yarn test
	cargo fmt -- --check
	cargo check
	cargo test
	anchor test

# COMMON
check:
	cargo check --workspace

clean:
	rm -rf scripts/tmp
	cargo clean

validator:
	@pgrep "solana-test-val" || solana-test-validator -q -r -c ALP8SdU9oARYVLgLR7LrqMNCYBnhtnQz1cj6bwgwQmgj H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG --url https://api.mainnet-beta.solana.com &

validator-kill:
	@pkill -9 "solana-test-val"

validator-reset: validator-kill
	@sleep 1
	@solana-test-validator --quiet --reset &

set-localnet:
	solana config set --url http://127.0.0.1:8899

validator-logs:
	solana logs

migrate:
	yarn ts-node scripts/migrate.ts

watch-anchor-test: build
	cargo watch -c -- anchor test -- --features "localnet"

watch-test:
	cargo watch -cx test

watch:
	cargo watch -- anchor build -- --features "localnet"

run-soteria:
	./scripts/run-soteria.sh

# used for anchor ci
anchor-ci:
	@solana -V
	@anchor -V
	solana-keygen new --no-bip39-passphrase || true
	yarn --frozen-lockfile
	yarn lint
	make test

# used for react/frontend ci
react-ci:
	solana-keygen new --no-bip39-passphrase || true
	cargo check
	cargo test
	yarn --frozen-lockfile
	./scripts/build.sh
	yarn lint
	yarn turbo run build --concurrency=1
	cd app; yarn serve-e2e

# start the local development stack
start:
	make validator
	yarn
	./scripts/build.sh
	anchor deploy
	yarn build
	make migrate

example-app-build:
	yarn
	./scripts/build.sh
	yarn build
	cd examples/sdk
	yarn build

# deploy contracts via ci or locally.
deploy:
	@./scripts/deploy.sh ${DEPLOY_CLUSTER} ${SOLANA_DEPLOY_KEY}
