#!/usr/bin/env bash
# Replaces `changeset version` for the FIXED-version group using plain text
# substitution (no Node, no compilation — just editing text in files): writes the
# SAME version into both package.json files and keeps react's internal dependency
# on core in lockstep.
#
#   scripts/version-bump.sh <version>      e.g. 0.3.0
#   npm run version-bump 0.3.0
#
# After bumping: move the `## [Unreleased]` notes to a `## [<version>] - <date>`
# section in packages/*/CHANGELOG.md (Keep a Changelog format), commit, then
# `git tag v<version> && git push origin v<version>`. See RELEASING.md.
set -euo pipefail

VERSION="${1:-}"

# Canonical Semantic Versioning 2.0.0 (https://semver.org/spec/v2.0.0.html):
# MAJOR.MINOR.PATCH with optional -prerelease and +build metadata.
SEMVER='^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$'

if [[ -z "$VERSION" || ! "$VERSION" =~ $SEMVER ]]; then
  echo "Usage: scripts/version-bump.sh <version>   (a SemVer 2.0.0 version, e.g. 0.3.0 or 0.3.0-rc.1)" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CORE="$ROOT/packages/core/package.json"
REACT="$ROOT/packages/react/package.json"

# Top-level "version" field (the only one at 2-space indent) in each package.
sed -i -E "s/^(  \"version\": \")[^\"]*(\",?)\$/\1${VERSION}\2/" "$CORE" "$REACT"

# react's internal dependency range on core, kept in lockstep.
sed -i -E "s/(\"@timekeeper-countdown\/core\": \"\^)[^\"]*(\")/\1${VERSION}\2/" "$REACT"

echo "Bumped core + react to ${VERSION}; react -> core ^${VERSION}."
echo "Next: update packages/*/CHANGELOG.md (## [${VERSION}] - $(date +%F)), commit, then 'git tag v${VERSION} && git push origin v${VERSION}'."
