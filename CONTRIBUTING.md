# Contributing to Timekeeper Countdown

Thank you for your interest in contributing! All contributions are welcome — whether it's reporting a bug, suggesting a feature, improving documentation, or submitting code.

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) in all interactions.

## How to Contribute

- **Report bugs** using the [bug report template](https://github.com/eagle-head/timekeeper-countdown/issues/new?template=bug_report.yml)
- **Suggest features** using the [feature request template](https://github.com/eagle-head/timekeeper-countdown/issues/new?template=feature_request.yml)
- **Improve documentation** in the `docs/` directory
- **Submit pull requests** for bug fixes or features
- **Review existing PRs** to help the maintainers

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm (comes with Node.js)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/eagle-head/timekeeper-countdown.git
cd timekeeper-countdown

# Install dependencies (always from the root — never inside individual packages)
npm install
```

### Key Scripts

| Command                                                | Description             |
| ------------------------------------------------------ | ----------------------- |
| `npm run build`                                        | Build all packages      |
| `npm run test`                                         | Run all tests           |
| `npm run lint`                                         | Lint all packages       |
| `npm run typecheck`                                    | Type check all packages |
| `npm run format:check`                                 | Check code formatting   |
| `npm run test --workspace @timekeeper-countdown/core`  | Test core only          |
| `npm run test --workspace @timekeeper-countdown/react` | Test react only         |

## Project Structure

```
packages/
├── core/    # @timekeeper-countdown/core — zero-dependency countdown engine
│              (state machine, timer, formatter, testing utilities)
├── react/   # @timekeeper-countdown/react — React hook adapter (useCountdown)
└── docs/    # VitePress documentation site
```

## Development Workflow

1. **Fork** the repository (or create a branch if you have write access)
2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
3. **Make your changes** and add or update tests as needed
4. **Run the checks** before committing:
   ```bash
   npm run lint && npm run typecheck && npm run test
   ```
5. **Commit** using [Conventional Commits](#commit-convention)
6. **Push** and open a pull request against `main`

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/). The basic format is:

```
<type>(<scope>): <subject>
```

Common types: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `ci`

For the full guide with all types, scopes, and examples, see [.github/commit-convention.md](.github/commit-convention.md).

## Pull Request Guidelines

- Fill out the **PR template** completely
- **Link related issues** using `fixes #123` or `closes #123`
- Keep PRs **focused** — one feature or fix per PR
- **Add tests** for new functionality
- **Update documentation** if behavior changes
- Add a **changeset** for user-facing changes:
  ```bash
  npm run changeset
  ```
  Follow the prompts to describe your change and its semver impact.
- **CI must pass** before your PR can be merged

## Code Style

The project uses ESLint 9 and Prettier for linting and formatting. TypeScript strict mode is enabled. Run `npm run lint` and `npm run format:check` to verify your code.

### Naming Conventions

| Element                   | Convention                    | Example                                |
| ------------------------- | ----------------------------- | -------------------------------------- |
| Files                     | `kebab-case`                  | `countdown-engine.ts`                  |
| Factory functions & types | `PascalCase`                  | `CountdownEngine`, `CountdownSnapshot` |
| React hooks               | `camelCase` with `use` prefix | `useCountdown`                         |
| Constants                 | `UPPER_SNAKE_CASE`            | `SECONDS_PER_MINUTE`                   |

### Key Patterns

- **Factory functions, not classes** — all constructs are called without `new`
- **`_` prefix = private** — properties prefixed with `_` are mangled in production builds

## Testing

- **Framework:** [Vitest](https://vitest.dev/) with `globals: true`
- **Test location:** `src/__tests__/*.test.ts` (core) or `src/__tests__/*.test.tsx` (react)
- **Time mocking:** Use `vi.useFakeTimers()` in `beforeEach` and `vi.useRealTimers()` in `afterEach`
- **React tests:** Use `renderHook` and `act` from `@testing-library/react`
- **Custom test helpers:** Available from `@timekeeper-countdown/core/testing-utils` — includes `createFakeTimeProvider()`, `buildSnapshot()`, and assertion utilities

Run tests for a specific package:

```bash
npm run test --workspace @timekeeper-countdown/core
npm run test --workspace @timekeeper-countdown/react
```

## Reporting Issues

- Use the **bug report** template for bugs — include clear reproduction steps
- Use the **feature request** template for ideas and suggestions
- **Search existing issues** before opening a new one
- **One issue per bug or feature** — don't combine multiple topics
- For **general questions** or help, use [GitHub Discussions](https://github.com/eagle-head/timekeeper-countdown/discussions)

Thank you for helping make Timekeeper Countdown better!
