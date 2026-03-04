# Timekeeper Countdown ⏳

Welcome to the monorepo for **Timekeeper Countdown**. The current public release ships the React hook package; the shared countdown engine lives alongside it and powers the hook as well as future adapters.

## Packages

| Package | Description | Status |
| --- | --- | --- |
| `@timekeeper-countdown/react` | React hook (`useCountdown`) that exposes the snapshot-driven timer API. | Stable / Published |
| `@timekeeper-countdown/core` | Countdown engine, formatting helpers, testing utilities. Currently consumed internally by the React package. | Internal (public API under evaluation) |

Planned adapters (Angular, Vue, Svelte, vanilla) will reuse the same engine; documentation and APIs will expand as each becomes available.

## Docs

The `docs/` folder contains the Docsify-powered site. It focuses on the React workflow today and outlines the roadmap for upcoming adapters. Run a static server and open `docs/index.html`, or publish the folder to GitHub Pages (a `.nojekyll` flag is included).

Useful entry points:

- `docs/getting-started.md` – install & render your first React timer.
- `docs/api-reference.md` – hook options, return types, helper modules.
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
