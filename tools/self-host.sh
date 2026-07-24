#!/bin/bash
set -e

cd "$(dirname "$0")/.."
cd server

if [ ! -f .env ]; then
  cp .env.example .env
fi

exec node dist/index.js
