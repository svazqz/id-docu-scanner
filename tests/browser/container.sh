#!/bin/sh
set -eu
export CYPRESS_INSTALL_BINARY=0 NX_DAEMON=false
workdir=$(mktemp -d)
trap 'rm -rf "$workdir"' EXIT
tar -C /src --exclude=./.git --exclude=node_modules --exclude=./dist --exclude=./.nx \
  --exclude=./.env --exclude=./.env.local -cf - . | tar -C "$workdir" -xf -
cd "$workdir"

npm install --global pnpm@8.15.9 --no-audit --no-fund
pnpm install --frozen-lockfile
node_modules/.bin/vitest run --silent --threads=false --coverage.enabled --coverage.all \
  --coverage.include='src/**/*.{ts,tsx}' --coverage.exclude='**/*.spec.tsx' --coverage.reporter=text --coverage.lines=95
pnpm build
npm ci --prefix tests/browser --no-audit --no-fund
tests/browser/node_modules/.bin/playwright test --config tests/browser/playwright.config.mjs
