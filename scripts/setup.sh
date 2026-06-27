#!/usr/bin/env bash
set -euo pipefail

pnpm install
cp .env.example .env
pnpm prepare
