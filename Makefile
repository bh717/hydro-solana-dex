.PHONY: list
SHELL := /bin/bash
_ROOT_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))

list:
	@awk -F: '/^[A-z]/ {print $$1}' Makefile | sort

# install our fork of anchor
install_anchor:
	cargo install --git https://github.com/project-serum/anchor anchor-cli

install_solana:
	sh -c "$$(curl -sSfL https://release.solana.com/v1.9.6/install)"	

# build
build-idl-types:
	./scripts/build.sh

test:
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

watch-test:
	cargo watch -c -- anchor test -- --features "localnet"

watch:
	cargo watch -- anchor build -- --features "localnet"

anchor-ci:
	yarn install
	solana-keygen new --no-bip39-passphrase || true
	cargo check
	cargo test
	anchor build
	anchor test
	cargo fmt -- --check

react-ci-cd:
	cd app; yarn install
	cd app; yarn build
	#cd app; CI=true yarn test # Broke with inital UI
	cd app; ipd -C build/

# start the local development stack
start:
	solana-test-validator --quiet --reset &
	anchor build
	anchor deploy
	yarn
	yarn build
	anchor test --skip-deploy --skip-build
	make migrate
