#!/usr/bin/env sh
set -e

NETWORK=testnet
WORLD_CONTRACTS_PATH=<PATH_TO_WORLD_CONTRACTS>

CURRENT_DIR=$(pwd)

cd "$WORLD_CONTRACTS_PATH"

pnpm i
pnpm deploy-world $NETWORK
pnpm configure-world $NETWORK
pnpm create-test-resources $NETWORK
pnpm anchor-turret
pnpm online-turret
cp -r ./deployments/$NETWORK $CURRENT_DIR/deployments/$NETWORK
cp -r ./contracts/world/Pub.$NETWORK.toml $CURRENT_DIR/deployments/$NETWORK/Pub.$NETWORK.toml

