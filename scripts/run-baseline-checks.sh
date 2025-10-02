#!/usr/bin/env bash
set -euo pipefail

node scripts/generate-dependency-graph.mjs
node scripts/generate-ast-map.mjs
npm test
npm run lint
npm run build
