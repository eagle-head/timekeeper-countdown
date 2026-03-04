# Timekeeper Countdown ⏳

[![npm](https://img.shields.io/npm/v/@timekeeper-countdown/react?label=react&color=blue)](https://www.npmjs.com/package/@timekeeper-countdown/react)
[![npm](https://img.shields.io/npm/v/@timekeeper-countdown/core?label=core&color=blue)](https://www.npmjs.com/package/@timekeeper-countdown/core)
[![CI](https://github.com/eagle-head/timekeeper-countdown/actions/workflows/ci.yml/badge.svg)](https://github.com/eagle-head/timekeeper-countdown/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Welcome to the monorepo for **Timekeeper Countdown**. The current public release ships the React hook package; the shared countdown engine lives alongside it and powers the hook as well as future adapters.

## Why Timekeeper?

Most countdown libraries either lock you into a framework or sacrifice precision for simplicity. Timekeeper ships a **zero-dependency engine** that any framework can wrap, plus a React hook that uses it today.

- **Wall-clock precision** — tracks elapsed time via `performance.now`, not tick counting. Pausing and resuming never drifts.
- **Snapshot-driven API** — every tick delivers an immutable snapshot with pre-calculated `parts` (hours, minutes, seconds) and boolean helpers (`isRunning`, `isPaused`). No manual math.
- **Testable by design** — `@timekeeper-countdown/core/testing-utils` ships a fake time provider so you can unit-test countdown logic without `setTimeout` hacks.
- **Framework-agnostic core** — the engine has zero runtime dependencies. React today, Angular/Vue/Svelte adapters coming.

## Packages

| Package | Description | Status |
| --- | --- | --- |
| `@timekeeper-countdown/react` | React hook (`useCountdown`) that exposes the snapshot-driven timer API. | Stable / Published |
| `@timekeeper-countdown/core` | Countdown engine, formatting helpers, testing utilities. Powers the React hook and future framework adapters. | Stable / Published |

Planned adapters (Angular, Vue, Svelte, vanilla) will reuse the same engine; documentation and APIs will expand as each becomes available.

## Docs

The `docs/` folder contains the [VitePress](https://vitepress.dev/)-powered documentation site. Run the dev server locally:

```bash
npm run docs:dev
```

Or build for production with `npm run docs:build`. The site is deployed to GitHub Pages via CI.

Useful entry points:

- `docs/getting-started.md` – install & render your first React timer.
- `docs/react-integration.md` – hook API and usage patterns.
- `docs/roadmap.md` – status and plans for additional adapters.

## Development

Install dependencies once at the workspace root:

```bash
npm install
```

Key scripts:

```bash
npm run build        # Build all packages with tsup
npm run test         # Run Vitest across workspaces
npm run lint         # Lint via ESLint 9
npm run typecheck    # TypeScript --noEmit for every workspace
```

Each package also exposes the same scripts via `npm run <script> --workspace <name>` for focused work (e.g., `@timekeeper-countdown/react`).

### Package Builds

Both packages ship ESM bundles built through `tsup`. The React package publishes the hook, exports TypeScript definitions, and declares `react` / `react-dom` as peer dependencies. The core package provides the engine and shared utilities.

### Tests

Vitest powers the unit test suites in both packages. React tests use `@testing-library/react` with fake timers supplied by the testing utilities. When iterating on a single package, use `npm run test --workspace @timekeeper-countdown/react` (or `core`).

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

MIT © [Eduardo Kohn](https://www.linkedin.com/in/eduardo-kohn-56817b195/)
