#!/usr/bin/env bash
# Persistent API launcher (runs the Fastify API in WSL, foreground).
# The DB (postgres) is the docker-compose stack on WSL localhost:5433.
cd /mnt/i/Dev/immo-share/packages/api
export PRISMA_HIDE_UPDATE_MESSAGE=1
exec npx tsx src/server.ts
