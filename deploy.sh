#!/usr/bin/env bash
# deploy.sh — clean, repeatable production deploy for letloyal-production.
# Run on the VPS from the project root:  ./deploy.sh
#
# Why a script: doing `git pull`, a CLEAN build, and `pm2 reload` by hand every
# time invites half-finished builds (stale chunks -> client-side exceptions) and
# piled-up restarts. This makes every deploy identical and atomic.
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Pulling latest code"
git pull origin master

echo "==> Installing dependencies (only if package-lock changed)"
npm ci --omit=dev=false

echo "==> Clean build (removing old .next first)"
rm -rf .next
npm run build

echo "==> Reloading app (zero-downtime)"
# reload keeps the old process serving until the new one is ready, and does
# NOT inflate the restart counter the way repeated `restart` does.
pm2 reload letloyal-production --update-env

echo "==> Done. Current status:"
pm2 status letloyal-production
