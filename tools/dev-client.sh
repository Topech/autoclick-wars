#!/bin/bash
cd "$(dirname "$0")/.."
export $(grep -E '^GAME_CLIENT_PORT=' client/.env | xargs)
cd client && pnpm run build
