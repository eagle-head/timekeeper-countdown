# CLAUDE.md — timekeeper-countdown

## Project Overview

Monorepo for a countdown timer library. Two packages: `@timekeeper-countdown/core` (engine) and `@timekeeper-countdown/react` (React hook adapter). Framework adapters for Angular, Vue, Svelte, and vanilla JS are planned.

## Commands

```bash
# Install (run from root only)
npm install

# Build all packages
npm run build

# Build specific package
npm run build --workspace @timekeeper-countdown/core
npm run build --workspace @timekeeper-countdown/react

# Run all tests
npm run test

# Run tests for a specific package
npm run test --workspace @timekeeper-countdown/core

# Run mutation tests (Stryker)
npm run test:mutation

# Lint
npm run lint

# Format check
npm run format:check

# Type check
npm run typecheck

# Quality gate — the SAME script the git hooks and CI run
bin/quality-gate.sh            # full: build + format:check + lint + typecheck + test
bin/quality-gate.sh --fast     # fast lane (no tests); ./hooks/install.sh wires it into git

# Docs (VitePress)
npm run docs:dev      # dev server
npm run docs:build    # production build
npm run docs:preview  # preview built docs

# Release (manual version bump + tag push — see RELEASING.md)
npm run version-bump 0.3.0   # writes both package.json versions + react->core range in lockstep
# then edit packages/*/CHANGELOG.md, commit, and:
git tag v0.3.0 && git push origin v0.3.0   # triggers .github/workflows/release.yml (publishes core then react)
```

## Architecture

```
packages/
├── core/          # @timekeeper-countdown/core — zero-dependency countdown engine
│   ├── src/
│   │   ├── api/               # Public API
│   │   │   ├── countdown.ts         # Countdown() — high-level façade with formatting
│   │   │   └── countdown-engine.ts  # CountdownEngine() — core engine + observer pattern
│   │   ├── state/
│   │   │   └── state-machine.ts     # StateMachine() — IDLE→RUNNING→PAUSED/STOPPED→IDLE
│   │   ├── runtime/
│   │   │   ├── timer.ts             # Timer() — setInterval-based tick at 100ms
│   │   │   └── time-providers.ts    # High-res time abstraction (performance.now fallback)
│   │   ├── time/
│   │   │   ├── constants.ts         # Time math constants
│   │   │   └── decompose.ts         # decompose() — single lossless source of truth for the year/week/day/hour/min/sec breakdown (shared by engine, formatters, testing-utils)
│   │   └── format/
│   │       └── formatter.ts         # Formatter() + standalone format functions
│   └── testing-utils/         # Published test helpers (./testing-utils export)
│       ├── fake-time.ts             # createFakeTimeProvider()
│       ├── snapshots.ts             # buildSnapshot(), buildSnapshotSequence()
│       └── assertions.ts            # assertSnapshotState(), etc.
├── react/         # @timekeeper-countdown/react — React hook
│   └── src/
│       └── use-countdown.ts   # useCountdown() hook
└── docs/          # VitePress documentation site
```

### Core exports

| Export path                                | Content                                                |
| ------------------------------------------ | ------------------------------------------------------ |
| `@timekeeper-countdown/core`               | `Countdown`, `CountdownEngine`, `buildSnapshot`, types |
| `@timekeeper-countdown/core/format`        | `Formatter`, `formatSeconds`, `formatMinutes`, etc.    |
| `@timekeeper-countdown/core/testing-utils` | `createFakeTimeProvider`, `buildSnapshot`, assertions  |

## Key Patterns

- **Factory functions, not classes** — All constructs (`Countdown()`, `CountdownEngine()`, `StateMachine()`, `Timer()`, `Formatter()`) are PascalCase factory functions called without `new`, returning plain objects.
- **Observer pattern** — `CountdownEngine` uses a `Set<listener>` for subscriptions, not EventEmitter.
- **Idempotent state transitions** — Actions return `boolean` (true = transitioned, false = no-op). No exceptions thrown for invalid transitions.
- **Defensive error swallowing** — All observer/callback errors are caught internally to never crash the timer.
- **Immutable snapshots** — Each state change produces a new `CountdownSnapshot` object.
- **`_` prefix = private** — Properties prefixed with `_` are mangled by esbuild in production (`mangleProps: /^_/` in core's tsup config).
- **Wall-clock precision** — Timer tracks `startTimestamp` + `pausedDuration` for precision; only fires `onTick` when the whole-second value changes.

## Code Style

- **Files:** `kebab-case` (e.g., `countdown-engine.ts`, `state-machine.ts`)
- **Factories/types:** `PascalCase` (e.g., `CountdownEngine`, `CountdownSnapshot`)
- **React hooks:** `camelCase` with `use` prefix (`useCountdown`)
- **Constants:** `UPPER_SNAKE_CASE` (`SECONDS_PER_MINUTE`, `TimerState.IDLE`)
- **State enum pattern:** `Object.freeze({ IDLE: 'IDLE', ... })` used as both value and type
- ESLint 9 flat config + Prettier; `no-explicit-any` is a warning (off in tests)
- TypeScript strict mode; `noUnusedLocals`, `noUnusedParameters` enabled

## Testing

- **Framework:** Vitest 4 with `globals: true`, `environment: 'jsdom'`
- **Tests location:** `src/__tests__/*.test.ts` (core), `src/__tests__/*.test.tsx` (react)
- **Time mocking pattern:** `vi.useFakeTimers()` in `beforeEach`, `vi.useRealTimers()` in `afterEach`
- **Module mocking:** `vi.hoisted()` + `vi.mock()` for time-providers; `vi.doMock()` for per-test mocks
- **React tests:** `renderHook` + `act` from `@testing-library/react`, `vi.advanceTimersByTime()` to drive intervals
- **React vitest config:** path aliases resolve `@timekeeper-countdown/core` to source TypeScript (not dist)
- **Coverage:** `@vitest/coverage-v8`, reporters: text, json, html
- **Mutation testing:** Stryker (`npm run test:mutation`); per-package `stryker.config.json` with `vitest` runner and break thresholds (core 85, react 75)
- **Property-based testing:** fast-check (e.g. `src/__tests__/decomposition.test.ts`)
- **Custom test utils:** `createFakeTimeProvider()`, `buildSnapshot()`, `assertSnapshotState()` from core's `testing-utils`

## Build

- **Bundler:** tsup (esbuild-based)
- **Output:** ESM + CJS, with `.d.ts` declarations
- **Target:** `es2022`
- **Production:** `minify: true`, `treeshake: true`, `drop: ['console', 'debugger']` (core only)
- **Monorepo:** npm workspaces; all devDependencies hoisted to root
- **Versioning:** [SemVer 2.0.0](https://semver.org); manual lockstep bump via `scripts/version-bump.sh` (`npm run version-bump <version>`) — both packages always share one version; a `vX.Y.Z` tag publishes both. CHANGELOGs follow [Keep a Changelog](https://keepachangelog.com).

## Gotchas

- Run `npm install` only at the root — never inside individual packages.
- React package's vitest config uses path aliases to core's TypeScript source, so core doesn't need to be built for React tests to pass.
- The `testing-utils` directory lives at `packages/core/testing-utils/` (not under `src/`) but is a separate tsup entry point published as `@timekeeper-countdown/core/testing-utils`.
- Releases are tag-triggered — run `npm run version-bump <version>`, edit `packages/*/CHANGELOG.md`, commit, then push a `vX.Y.Z` tag; `.github/workflows/release.yml` publishes core then react. See RELEASING.md.
- Some code comments are in Portuguese.
