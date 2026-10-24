#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
npm ci
node scripts/setup.mjs
npm run build
npm start
