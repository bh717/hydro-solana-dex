.PHONY: list
SHELL := /bin/bash
_ROOT_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))

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

install_anchor_avm:
	@avm use latest || cargo install --git https://github.com/project-serum/anchor avm --locked --force && avm use latest

install_anchor:
	cargo install --git https://github.com/project-serum/anchor --tag v0.22.1 anchor-cli --locked

install_solana:
	solana-install update || sh -c "$$(curl -sSfL https://release.solana.com/v1.9.6/install)"

install_wasm_pack:
	wasm-pack -V || cargo install wasm-pack

install_node:
	node --version || echo Direction can be found here: https://nodejs.org/en/

install_yarn:
	yarn --version || echo Direction can be found here: https://yarnpkg.com/getting-started/install

install_project_deps:
	yarn
	make build

# build
build:
	./scripts/build.sh
	yarn turbo run build

test: build
	cargo test
	anchor test

# COMMON
check:
	cargo check --workspace

clean:
	rm -rf scripts/tmp
	cargo clean

validator:
	@pgrep "solana-test-val" || solana-test-validator &

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

anchor-ci:
	solana-keygen new --no-bip39-passphrase || true
	cargo fmt -- --check
	cargo check
	cargo test
	yarn --frozen-lockfile
	./scripts/build.sh
	yarn lint
	yarn turbo run build --concurrency=1
	yarn test
	anchor test

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
	solana-test-validator --quiet --reset &
	anchor build
	anchor deploy
	yarn
	./scripts/build.sh
	yarn build
	make migrate
