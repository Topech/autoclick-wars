#!/bin/bash
cd "$(dirname "$0")/.."
export $(grep -E '^GAME_SERVER_PORT=' server/.env | xargs)
cd server && pnpm run dev
