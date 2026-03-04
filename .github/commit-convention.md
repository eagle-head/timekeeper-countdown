# Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/).

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Only `<type>` and `<subject>` are required. Scope, body, and footer are optional.

## Types

| Type       | Description                          |
| ---------- | ------------------------------------ |
| `feat`     | New feature                          |
| `fix`      | Bug fix                              |
| `docs`     | Documentation only                   |
| `style`    | Code style changes (no logic change) |
| `refactor` | Code refactoring (no feature or fix) |
| `perf`     | Performance improvement              |
| `test`     | Adding or updating tests             |
| `chore`    | Maintenance, dependencies, tooling   |
| `ci`       | CI/CD configuration                  |
| `build`    | Build system changes                 |

## Scopes

Scopes are optional. Use them when the change is specific to a package:

| Scope   | When to use                              |
| ------- | ---------------------------------------- |
| `core`  | Changes to `@timekeeper-countdown/core`  |
| `react` | Changes to `@timekeeper-countdown/react` |
| `docs`  | Changes to the documentation site        |
| `deps`  | Dependency updates                       |

Omit the scope when the change spans multiple packages or is project-wide.

## Rules

- Use **imperative mood**: "add feature" not "added feature"
- **Do not capitalize** the first letter of the subject
- **No period** at the end of the subject
- Subject line: **max 50 characters**
- Body: wrap at **72 characters** per line
- Separate subject from body with a **blank line**

## Breaking Changes

Indicate breaking changes with `!` before the colon:

```
feat(core)!: remove deprecated startFrom option
```

Or use the `BREAKING CHANGE:` footer:

```
feat(core): change snapshot format

BREAKING CHANGE: snapshot.remaining is now in milliseconds instead of seconds
```

## Examples

```
feat(react): add onComplete callback to useCountdown
```

```
fix(core): correct elapsed time calculation after resume
```

```
docs: update getting started guide
```

```
test(core): add edge case tests for pause/resume cycle
```

```
refactor(core): extract tick logic into separate function
```

```
chore(deps): bump vitest to v2
```

```
ci: add Node 20 to test matrix
```

```
perf(core): reduce unnecessary snapshot allocations
```

```
style: apply prettier formatting to config files
```

```
build: update tsup config for tree-shaking
```
