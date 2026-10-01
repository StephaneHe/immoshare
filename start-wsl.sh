#!/usr/bin/env bash
# Lance immo-share API depuis WSL Ubuntu-20.04 (monorepo pnpm)
set -e
ROOT="/mnt/i/Dev/immo-share"
API_DIR="$ROOT/packages/api"
BIN="$ROOT/node_modules/.bin"

cd "$API_DIR"

echo "[immo-share] prisma migrate deploy..."
"$BIN/prisma" migrate deploy 2>&1 || echo "migrate skipped"

echo "[immo-share] démarrage API (tsx)..."
exec "$BIN/tsx" src/server.ts
