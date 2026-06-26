#!/usr/bin/env bash
#
# Canonical quality gate — the SINGLE source of truth for the pre-commit and
# pre-push git hooks AND for CI (.github/workflows/ci.yml runs this same script).
#
# Lanes:
#   --fast | --pre-commit   build + format:check + lint + typecheck   (no tests; quick)
#   --full | --pre-push     the fast lane + the full test suite       (default)
#   --ci                    alias for --full (used by CI)
#
# It does NOT install dependencies — run `npm ci`/`npm install` first (CI does;
# locally they are already present). Runs every step even if an earlier one
# fails, then exits non-zero if ANY step failed, listing them.
set -uo pipefail

cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)"

LANE="${1:---full}"
FAILED=()

run() { # run <label> <cmd...>
  local label="$1"
  shift
  printf '\n\033[1m▶ %s\033[0m\n' "$label"
  if "$@"; then
    printf '\033[32m✓ %s\033[0m\n' "$label"
  else
    printf '\033[31m✗ %s\033[0m\n' "$label"
    FAILED+=("$label")
  fi
}

# `build` runs first because the React package's typecheck resolves
# @timekeeper-countdown/core from its built types.
static_checks() {
  run "build" npm run build
  run "format:check" npm run format:check
  run "lint" npm run lint
  run "typecheck" npm run typecheck
}

case "$LANE" in
  --fast | --pre-commit)
    static_checks
    ;;
  --full | --pre-push | --ci | "")
    static_checks
    run "test" npm run test
    ;;
  *)
    echo "usage: bin/quality-gate.sh [--fast|--pre-commit|--full|--pre-push|--ci]" >&2
    exit 2
    ;;
esac

if ((${#FAILED[@]})); then
  printf '\n\033[31m✗ Quality gate FAILED\033[0m (%s): %s\n' "$LANE" "${FAILED[*]}"
  exit 1
fi
printf '\n\033[32m✓ Quality gate passed\033[0m (%s)\n' "$LANE"
