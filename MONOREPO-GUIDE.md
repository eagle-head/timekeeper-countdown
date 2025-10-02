# Expanding Timekeeper Countdown into a Scoped Monorepo

This note sketches a path to keep `timekeeper-countdown` as the source of truth while exposing framework-specific entry points such as `@timekeeper-countdown/react`.

## Recommended Repository Layout

```
/timekeeper-countdown
├─ package.json                # workspace root (private)
├─ packages/
│  ├─ core/                    # existing library renamed → publishes as `timekeeper-countdown`
│  ├─ react/                   # publishes as `@timekeeper-countdown/react`
│  └─ ...                      # future adapters (vue, svelte, angular, ...)
├─ docs/                       # shared docs kept in main
├─ examples/                   # reorganised per framework (import from packages/*)
└─ .changeset/                 # Changesets drives versioning per package
```

Use npm workspaces (`"workspaces": ["packages/*"]`) or migrate to pnpm/yarn if preferred. Mark the root `package.json` as `"private": true` to avoid accidental publishes.

## Package Boundaries & Code Organization

- Move current `src/` into `packages/core/src` with the same build tooling (`tsup`, `vitest`).
- Restructure the code inside `core` so reusable primitives live under clear folders (e.g., `runtime/`, `state/`, `format/`). Export a single `Countdown` façade but preserve granular imports for adapters.
- Each adapter package depends on `timekeeper-countdown` and re-exports framework-friendly APIs.
- Share TypeScript configs by hoisting `tsconfig.base.json` at the root, then extend inside each package.
- Keep linting & formatting centralised via root scripts that delegate to package-level configs when needed.

## Refactoring Strategy for Maximum Reuse

- Split today’s modules into composable units:
  - `packages/core/src/runtime/timer.ts` → platform-agnostic ticking logic (no direct formatting or UI callbacks).
  - `packages/core/src/state/state-machine.ts` → finite-state transitions.
  - `packages/core/src/format/formatter.ts` → _optional_ helpers for consumers that want strings with padding.
  - `packages/core/src/api/countdown.ts` → public factory that wires the pieces together and exposes a clean observer API.
- Redesign `Countdown` to emit structured snapshots `{ totalSeconds, parts: { days, hours, ... }, state }` through callbacks/observables, instead of only formatted strings. Keep formatting out of the core surface so each adapter picks its own presentation.
- Publish typed entry points from `core` (e.g., `CountdownEngine`, `CountdownSnapshot`, `TimerState`, `CountdownOptions`) so adapters never reimplement timing logic—only bridge to framework patterns.
- Introduce a thin adapter interface (`packages/core/src/adapters/adapter.types.ts`) capturing the observer contract (subscribe/unsubscribe, snapshot payload). React/Vue wrappers implement this contract to hook into their state systems.
- Update unit tests around the new snapshot API and keep behaviour tests in `packages/core/src/__tests__/…`; add adapter-focused tests within each framework package using the shared engine.
- Move shared utilities (mock time providers, fixtures) into `packages/core/testing/` so adapters can import them without duplication.
- When building the first adapter (React), refactor existing example logic into reusable hooks/components: e.g., `useCountdown` lives in `packages/react/src/useCountdown.ts`, subscribes to `CountdownEngine`, and surfaces hook-friendly state.

## Additional Improvements Before Adapters

- **Configurable time providers**: allow `Countdown` to accept a `timeProvider` option (defaulting to the safe global) so tests and adapters can plug deterministic clocks (e.g., RxJS `interval`, RAF) without patching modules.
- **Expose error channels**: instead of swallowing exceptions inside `start/pause/resume` (`try { … } catch {}`), surface them through `onError` callbacks or result objects `{ ok, error? }` so adapters can react.
- **Unify formatting helpers**: demote the formatter to optional utilities (`@timekeeper-countdown/core/format`). Core events carry raw numbers; adapters choose how to present `MM:SS`, localized strings, or raw deltas.
- **Align documentation & examples**: once the new snapshot API exists, update `docs/api-reference.md` and rebuild the framework examples to import from `packages/*` so they mirror the real exports.

## Build & Test Strategy

- Configure `tsup` (or `tsup --project`) per package with outputs in `packages/*/dist`.
- Define root scripts such as `npm run build --workspaces`, `npm run test --workspaces`, and `npm run lint --workspaces` so npm orchestrates the packages without extra tooling.
- Continue using Vitest for core logic; adapters can rely on framework-specific test utils (e.g., React Testing Library) scoped to their package.

## Do You Need Nx or TurboRepo?

- Not initially. With only a handful of packages, npm workspaces keep the setup simple and avoid extra config.
- Consider Nx/TurboRepo later if you accumulate many packages, need task graph caching, or want orchestrated CI pipelines.
- Should you migrate, both tools can sit on top of the workspace layout above—no need to restructure again.

## Publishing & Versioning

- Switch Changesets config to `"baseBranch": "main"` with `"fixed": []`. It will track versions per package and generate combined changelogs.
- Core keeps the unscoped name `timekeeper-countdown`; adapters publish with the scoped naming (`@timekeeper-countdown/react`, etc.).
- Automate releases via GitHub Actions: run `npm run build --workspaces`, then `changeset publish` to push every changed package.

## Migration Steps

1. Create `packages/core/` and relocate existing sources/tests/build config.
2. Break the core code into the new folder structure (`runtime/`, `state/`, `format/`, `api/`) and fix internal imports accordingly.
3. Update import paths and root scripts to run workspace commands.
4. Introduce the first adapter (React) with a thin wrapper API; extract the hook/component code from `/examples` into `packages/react/src` so the examples import from packages.
5. Verify publishing by doing a dry run (`npm publish --dry-run`).
6. Update documentation to reference the scoped packages and new install instructions.

This approach keeps the repo monolithic but modular, simplifies future adapters, and allows all packages to evolve together without fragmenting maintenance.
