# Releasing

Both packages — `@timekeeper-countdown/core` and `@timekeeper-countdown/react` —
are a **fixed version group**: they always ship the same version. One `vX.Y.Z`
git tag publishes both, in order (core first, then react), via
[`.github/workflows/release.yml`](.github/workflows/release.yml).

Versions follow [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html)
and changelogs follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Cutting a release

1. Choose the new version (e.g. `0.3.0`).
2. Bump both packages and sync react's internal dependency on core, in lockstep:

   ```bash
   npm run version-bump 0.3.0
   ```

3. In `packages/core/CHANGELOG.md` and `packages/react/CHANGELOG.md` (both follow
   [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)), move the
   `## [Unreleased]` notes into a new `## [0.3.0] - YYYY-MM-DD` section, grouped
   under `### Added` / `### Changed` / `### Fixed`. The **core** section becomes
   the GitHub Release body.
4. Commit on a branch, open a PR, and merge to `main` (CI must pass).
5. Tag the merge commit on `main` and push the tag:

   ```bash
   git checkout main && git pull
   git tag v0.3.0
   git push origin v0.3.0
   ```

6. The **Release** workflow runs: it validates the tag matches **both** package
   versions, then builds, tests, type-checks, dry-runs, publishes **core** then
   **react** (polling the registry between so react never ships against a
   not-yet-live core), runs `npm audit signatures`, and finally creates a GitHub
   Release from the CHANGELOG.

Publishes use **npm provenance** (`--provenance`), so each tarball carries a
signed attestation linking it to this repo + workflow run.

### Prereleases

A prerelease version (e.g. `0.3.0-rc.1`, tag `v0.3.0-rc.1`) publishes to the
`next` dist-tag (never moving `latest`) and is marked as a GitHub pre-release
automatically.

### Re-running a release

Re-running a tag (**Actions → Release → Run workflow**, `tag: v0.3.0`, or just
re-pushing) is safe: a package whose `name@version` is already live is detected
and skipped, so a partial failure (e.g. core published, react failed) can be
resumed without error.

## One-time setup (a human must do these once — the workflow cannot)

1. **npm token** — on npmjs.com create a **Granular Access token** (or classic
   _Automation_ token; both bypass 2FA for CI) with **publish** rights to both
   `@timekeeper-countdown/*` packages.
2. **GitHub Environment** — repo **Settings → Environments → New environment**
   named **`npm-publish`**. Add the token there as a secret named **`NPM_TOKEN`**.
   Optionally add **required reviewers** so each publish waits for manual approval.
3. The `repository` field in both `package.json` files already points at
   `eagle-head/timekeeper-countdown`, which provenance requires — no action needed.

## Alternative: OIDC Trusted Publishing (no token)

npm supports tokenless **trusted publishing** via OIDC (GA since 2025-07-31). To
adopt it later instead of `NPM_TOKEN`:

- Add `npm install -g npm@latest` before the publish steps (OIDC needs npm
  ≥ 11.5.1; Node 22 bundles npm 10.x), and drop the `NODE_AUTH_TOKEN` env and the
  `--provenance` flag (provenance becomes automatic under OIDC).
- On npmjs.com, for **each** package (core **and** react) →
  **Settings → Trusted Publisher → GitHub Actions**: organization `eagle-head`,
  repository `timekeeper-countdown`, workflow filename `release.yml`, environment
  `npm-publish`.
- Then `NPM_TOKEN` can be deleted. Note: renaming `release.yml` breaks trusted
  publishing until the publisher config is updated.
