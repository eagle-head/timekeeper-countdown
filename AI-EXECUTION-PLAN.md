# AI Execution Plan for Timekeeper Countdown Monorepo Transition

This document describes the incremental steps an automated agent should execute to evolve the repository into a scoped monorepo with reusable adapters.

## Phase 0 – Baseline Snapshot & Guardrails
- Export the current dependency graph using a TypeScript-aware tool (e.g., `npx ts-dependency-graph`). Store the report under `docs/internal/dependency-graph.json` for reference.
- Run the existing automation (`npm test`, `npm run lint`, `npm run build`) and capture logs in `artifacts/baseline/`.
- Archive current documentation output (copy `docs/` as-is into `artifacts/baseline/docs`).
- Generate AST metadata for `src/**/*.ts` via `ts-morph` or `tsc --generateTrace ast` and persist in `artifacts/baseline/ast-map.json`. This snapshot guides future codmods.
- Configure GitHub Actions (dry run) or local CI scripts to execute the above commands on every branch touched during the migration.

## Phase 1 – Core Package Extraction
- Create `packages/core/` and move `src/`, `tsconfig.*`, `vitest.config.ts`, and related build files underneath it. Adjust relative imports; ensure the root `package.json` declares workspaces (`"workspaces": ["packages/*"]`) and is marked `"private": true`.
- Implement a new `CountdownEngine` in `packages/core/src/api/countdown-engine.ts` that emits structured snapshots `{ totalSeconds, parts, state }` and accepts injected time providers plus an `onError` hook.
- Keep the legacy `Countdown` function exposed but make it a thin wrapper over the engine so downstream code remains compatible during migration.
- Update unit tests to target the engine API. Place them in `packages/core/src/__tests__/` and ensure Vitest runs via `npm run test --workspaces`.

## Phase 2 – Formatting & Utility Isolation
- Move formatting helpers into `packages/core/src/format/` and export them explicitly (`@timekeeper-countdown/core/format`). Ensure they operate on numeric snapshots instead of calling the engine.
- Create `packages/core/testing/` with reusable fake time providers, snapshot builders, and common assertions.
- Adjust documentation references (internal docs) to indicate formatting is optional and how to import helpers.

## Phase 3 – Adapter Scaffolding
- Create `packages/react/` and migrate logic from `examples/integrations/react.ts` into a proper hook (`useCountdown`) built on `CountdownEngine` snapshots.
- Add adapter-specific Vitest suites (e.g., `packages/react/src/__tests__/use-countdown.test.tsx`) exercising subscription behaviour against the shared testing utilities.
- Defer additional framework adapters (Vue, Svelte, Angular) until there is a concrete need.

**Status:** Completed for React. The React hook now propagates countdown snapshots under fake time (updated tests in `packages/react/src/__tests__/use-countdown.test.tsx`), and the core suite is stable after fixing hoisted timer mocks. Other framework adapters are intentionally out of scope.

## Phase 4 – Documentation & Tooling Alignment
- Update `docs/api-reference.md`, tutorials, and README to reflect the new snapshot API and installation instructions for scoped adapters (`@timekeeper-countdown/react`, etc.).
- Revise `AGENTS.md` and `MONOREPO-GUIDE.md` to match the final command set (`npm run build --workspaces`, `npm run test --workspaces`).
- Configure GitHub Actions with separate jobs for lint/test/build per workspace, plus a job that publishes documentation from `main` → `docs/`.
- Ensure `.changeset/config.json` is adjusted for multi-package releases (individual package versions, base branch `main`).

## Phase 5 – Cleanup & Release
- Remove compatibility shims once consumers adopt the new API. Delete deprecated examples in `examples/integrations/` that duplicate adapter functionality.
- Run `npm run build --workspaces` and `npm run test --workspaces` to confirm everything is green.
- Use Changesets to prepare releases: `changeset`, `changeset version`, `npm run build --workspaces`, `changeset publish`.
- Tag the release (`git tag`/`git push --tags`) and update changelog entries.

## Automation Notes
- Each phase should be committed independently with clear messages so rollbacks are isolated.
- Prefer codmods over manual edits when moving files or rewriting imports to reduce human error.
- Validate after each phase by re-running the baseline commands and comparing outputs to ensure regressions are caught early.
