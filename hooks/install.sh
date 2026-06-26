#!/usr/bin/env bash
#
# One-time setup: point git at this repo's `hooks/` directory so the
# pre-commit / pre-push quality gates run automatically. Requires Git >= 2.9
# (core.hooksPath). Idempotent — safe to re-run after pulling hook updates.
#
#     ./hooks/install.sh
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "Not a git repository." >&2
  exit 1
}
cd "$REPO_ROOT"

chmod +x hooks/pre-commit hooks/pre-push hooks/install.sh bin/quality-gate.sh
git config core.hooksPath hooks

echo "Git hooks installed (core.hooksPath -> hooks/):"
echo "  pre-commit -> bin/quality-gate.sh --pre-commit  (build + format + lint + types)"
echo "  pre-push   -> bin/quality-gate.sh --pre-push    (+ test suite)"
echo
echo "Run manually:  bin/quality-gate.sh [--fast|--full]"
