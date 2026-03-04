# Open Source Contribution Documentation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add complete open source contribution documentation and CI so anyone can contribute to timekeeper-countdown following industry best practices.

**Architecture:** Create 9 new files across repo root and `.github/` directory, update README.md, and add a CI workflow. No code changes — only documentation and GitHub configuration.

**Tech Stack:** GitHub Actions, YAML issue templates, Markdown, Contributor Covenant v2.1

---

### Task 1: CODE_OF_CONDUCT.md

**Files:**

- Create: `CODE_OF_CONDUCT.md`

**Step 1: Create the file**

Write the Contributor Covenant v2.1 to `CODE_OF_CONDUCT.md` in the repo root. Use the standard template from https://www.contributor-covenant.org/version/2/1/code_of_conduct/ with these values:

- **Enforcement contact:** `eduardo.kohn@outlook.com` (confirm with Eduardo)
- **Community name:** Timekeeper Countdown

The file should include all standard sections: Our Pledge, Our Standards, Enforcement Responsibilities, Scope, Enforcement, Enforcement Guidelines (Correction, Warning, Temporary Ban, Permanent Ban), Attribution.

**Step 2: Commit**

```bash
git add CODE_OF_CONDUCT.md
git commit -m "docs: add Contributor Covenant v2.1 Code of Conduct"
```

---

### Task 2: Commit Convention Document

**Files:**

- Create: `.github/commit-convention.md`

**Step 1: Create the file**

Write `.github/commit-convention.md` with these sections:

1. **Format:** `<type>(<scope>): <subject>` (scope is optional)
2. **Types table:**
   | Type | Description |
   |------|-------------|
   | `feat` | New feature |
   | `fix` | Bug fix |
   | `docs` | Documentation only |
   | `style` | Code style (no logic change) |
   | `refactor` | Code refactoring |
   | `perf` | Performance improvement |
   | `test` | Adding or updating tests |
   | `chore` | Maintenance, dependencies |
   | `ci` | CI/CD configuration |
   | `build` | Build system changes |
3. **Scopes:** `core`, `react`, `docs`, `deps` (optional, use when change is package-specific)
4. **Rules:** imperative mood ("add" not "added"), no capital first letter, no period, subject max 50 chars, body wraps at 72 chars
5. **Breaking changes:** Add `!` before colon: `feat(core)!: remove deprecated API` or use `BREAKING CHANGE:` footer
6. **Examples:** One example per type, e.g.:
   - `feat(react): add onComplete callback to useCountdown`
   - `fix(core): correct elapsed time after resume`
   - `docs: update getting started guide`
   - `chore(deps): bump vitest to v2`

**Step 2: Commit**

```bash
git add .github/commit-convention.md
git commit -m "docs: add commit convention guide"
```

---

### Task 3: CONTRIBUTING.md

**Files:**

- Create: `CONTRIBUTING.md`

**Step 1: Create the file**

Write `CONTRIBUTING.md` in the repo root with these sections:

**1. Welcome**

- Thank contributors, say all contributions welcome (issues, PRs, docs, ideas)
- Link to CODE_OF_CONDUCT.md

**2. How to Contribute**

- Report bugs via issue templates
- Suggest features via issue templates
- Improve documentation
- Submit pull requests
- Review existing PRs

**3. Development Setup**

- Prerequisites: Node.js 18+, npm
- Clone the repo, run `npm install` at root (never inside packages)
- Key scripts table:
  | Command | Description |
  |---------|-------------|
  | `npm run build` | Build all packages |
  | `npm run test` | Run all tests |
  | `npm run lint` | Lint all packages |
  | `npm run typecheck` | Type check all packages |
  | `npm run format:check` | Check formatting |
  | `npm run test --workspace @timekeeper-countdown/core` | Test core only |
  | `npm run test --workspace @timekeeper-countdown/react` | Test react only |

**4. Project Structure**

- Brief description of each directory:
  - `packages/core/` — Zero-dependency countdown engine (state machine, timer, formatter)
  - `packages/react/` — React hook adapter (`useCountdown`)
  - `docs/` — VitePress documentation site

**5. Development Workflow**

1. Fork the repo (or create a branch if you have access)
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make changes with tests
4. Run the verification commands: `npm run lint && npm run typecheck && npm run test`
5. Commit using Conventional Commits (link to `.github/commit-convention.md`)
6. Push and open a PR against `main`

**6. Commit Convention**

- Brief summary: use `type(scope): subject` format
- Link to full docs in `.github/commit-convention.md`
- Common types: `feat`, `fix`, `docs`, `test`, `chore`

**7. Pull Request Guidelines**

- Fill out the PR template completely
- Link related issues with `fixes #123`
- Keep PRs focused — one feature or fix per PR
- Add tests for new functionality
- Update docs if behavior changes
- Add a Changeset for user-facing changes: run `npm run changeset` and follow prompts
- CI must pass before merge

**8. Code Style**

- ESLint 9 + Prettier handle formatting (run `npm run lint` and `npm run format:check`)
- TypeScript strict mode — fix all type errors (`npm run typecheck`)
- Files: `kebab-case.ts`
- Factories/types: `PascalCase` (e.g., `CountdownEngine`)
- Constants: `UPPER_SNAKE_CASE`
- Factory functions, not classes — call without `new`
- Prefix private properties with `_`

**9. Testing**

- Framework: Vitest with `globals: true`
- Tests live in `src/__tests__/*.test.ts` (core) or `src/__tests__/*.test.tsx` (react)
- Time mocking: `vi.useFakeTimers()` in `beforeEach`, `vi.useRealTimers()` in `afterEach`
- React tests: `renderHook` + `act` from `@testing-library/react`
- Run specific tests: `npm run test --workspace @timekeeper-countdown/core`
- Custom test helpers available from `@timekeeper-countdown/core/testing-utils`

**10. Reporting Issues**

- Use the bug report template for bugs (include reproduction steps)
- Use the feature request template for ideas
- Search existing issues before creating new ones
- One issue per bug or feature

**Step 2: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: add comprehensive CONTRIBUTING.md"
```

---

### Task 4: Issue Template — Bug Report

**Files:**

- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`

**Step 1: Create the file**

Write `.github/ISSUE_TEMPLATE/bug_report.yml`:

```yaml
name: Bug Report
description: Report a bug in timekeeper-countdown
title: '[Bug]: '
labels: ['bug']
body:
  - type: markdown
    attributes:
      value: |
        Thanks for reporting a bug! Please fill out the form below.

  - type: textarea
    id: description
    attributes:
      label: Bug Description
      description: A clear and concise description of the bug.
      placeholder: Describe the bug...
    validations:
      required: true

  - type: textarea
    id: reproduction
    attributes:
      label: Reproduction Steps
      description: Steps to reproduce the behavior.
      placeholder: |
        1. Create a countdown with...
        2. Call start()...
        3. After 5 seconds...
        4. See error...
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What you expected to happen.
    validations:
      required: true

  - type: dropdown
    id: package
    attributes:
      label: Affected Package
      options:
        - '@timekeeper-countdown/core'
        - '@timekeeper-countdown/react'
        - Both
    validations:
      required: true

  - type: textarea
    id: system-info
    attributes:
      label: System Information
      description: Paste relevant environment details.
      placeholder: |
        - Package version:
        - Node.js version:
        - OS:
        - Browser (if applicable):
      render: text

  - type: checkboxes
    id: validations
    attributes:
      label: Validations
      options:
        - label: I have read the [Code of Conduct](https://github.com/eduardokohn/timekeeper-countdown/blob/main/CODE_OF_CONDUCT.md)
          required: true
        - label: I have searched for [existing issues](https://github.com/eduardokohn/timekeeper-countdown/issues)
          required: true
        - label: I have tested with the latest version
          required: true
```

**Note:** Replace `eduardokohn` with the actual GitHub username/org. Check the repo URL.

**Step 2: Commit**

```bash
git add .github/ISSUE_TEMPLATE/bug_report.yml
git commit -m "docs: add bug report issue template"
```

---

### Task 5: Issue Template — Feature Request

**Files:**

- Create: `.github/ISSUE_TEMPLATE/feature_request.yml`

**Step 1: Create the file**

Write `.github/ISSUE_TEMPLATE/feature_request.yml`:

```yaml
name: Feature Request
description: Suggest a new feature or improvement
title: '[Feature]: '
labels: ['enhancement']
body:
  - type: markdown
    attributes:
      value: |
        Thanks for suggesting a feature! Please fill out the form below.

  - type: textarea
    id: motivation
    attributes:
      label: Problem or Motivation
      description: What problem does this feature solve? Why is it needed?
      placeholder: I'm always frustrated when...
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: Proposed Solution
      description: Describe the solution you'd like to see.
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives Considered
      description: Any alternative solutions or workarounds you've considered?

  - type: dropdown
    id: package
    attributes:
      label: Related Package
      options:
        - '@timekeeper-countdown/core'
        - '@timekeeper-countdown/react'
        - New adapter
        - Documentation
    validations:
      required: true

  - type: checkboxes
    id: validations
    attributes:
      label: Validations
      options:
        - label: I have read the [Code of Conduct](https://github.com/eduardokohn/timekeeper-countdown/blob/main/CODE_OF_CONDUCT.md)
          required: true
        - label: I have searched for [existing issues](https://github.com/eduardokohn/timekeeper-countdown/issues)
          required: true
```

**Step 2: Commit**

```bash
git add .github/ISSUE_TEMPLATE/feature_request.yml
git commit -m "docs: add feature request issue template"
```

---

### Task 6: Issue Template — Config

**Files:**

- Create: `.github/ISSUE_TEMPLATE/config.yml`

**Step 1: Create the file**

Write `.github/ISSUE_TEMPLATE/config.yml`:

```yaml
blank_issues_enabled: false
contact_links:
  - name: Questions & Help
    url: https://github.com/eduardokohn/timekeeper-countdown/discussions
    about: Ask questions and get help from the community.
```

**Note:** If the repo doesn't use GitHub Discussions, change URL to point to issues with a `question` label, or remove the contact_links and just set `blank_issues_enabled: false`.

**Step 2: Commit**

```bash
git add .github/ISSUE_TEMPLATE/config.yml
git commit -m "docs: add issue template config (disable blank issues)"
```

---

### Task 7: Pull Request Template

**Files:**

- Create: `.github/PULL_REQUEST_TEMPLATE.md`

**Step 1: Create the file**

Write `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Description

<!-- What does this PR do? Why is it needed? -->

Fixes #<!-- issue number -->

## Type of Change

<!-- Check the one that applies -->

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Chore (dependencies, CI, build, etc.)

## How to Test

<!-- Describe how reviewers can test your changes -->

1.
2.
3.

## Checklist

- [ ] My code follows the project's code style
- [ ] I have added/updated tests for my changes
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] I have followed the [commit convention](.github/commit-convention.md)
- [ ] I have added a changeset (`npm run changeset`) if this is a user-facing change
- [ ] I have updated documentation if needed
```

**Step 2: Commit**

```bash
git add .github/PULL_REQUEST_TEMPLATE.md
git commit -m "docs: add pull request template"
```

---

### Task 8: CI Workflow

**Files:**

- Create: `.github/workflows/ci.yml`

**Step 1: Create the file**

Write `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint & Format
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck

  test:
    name: Test (Node ${{ matrix.node-version }})
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm
      - run: npm ci
      - run: npm run test

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
```

**Step 2: Verify the workflow syntax is valid**

Run: `cat .github/workflows/ci.yml | head -5`
Expected: `name: CI` displayed correctly.

**Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add CI workflow for lint, typecheck, test, and build"
```

---

### Task 9: Update README.md

**Files:**

- Modify: `README.md:51-59`

**Step 1: Update the Contributing section**

Replace the existing Contributing section (lines 51-59) in `README.md` with:

```markdown
## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).
```

This removes:

- The basic 5-step instructions (now in CONTRIBUTING.md)
- The reference to non-existent `AGENTS.md`

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README contributing section to link to CONTRIBUTING.md"
```

---

### Task 10: Final Verification

**Step 1: Verify all files exist**

Run: `find . -name "*.yml" -path "./.github/*" -o -name "*.md" -path "./.github/*" -o -name "CONTRIBUTING.md" -o -name "CODE_OF_CONDUCT.md" | sort`

Expected output:

```
./.github/commit-convention.md
./.github/ISSUE_TEMPLATE/bug_report.yml
./.github/ISSUE_TEMPLATE/config.yml
./.github/ISSUE_TEMPLATE/feature_request.yml
./.github/PULL_REQUEST_TEMPLATE.md
./.github/workflows/ci.yml
./.github/workflows/deploy-docs.yml
./CODE_OF_CONDUCT.md
./CONTRIBUTING.md
```

**Step 2: Verify README.md no longer references AGENTS.md**

Run: `grep -c "AGENTS.md" README.md`
Expected: `0`

**Step 3: Verify CI workflow linting passes locally**

Run: `npm run lint && npm run typecheck && npm run test && npm run build`
Expected: All pass (no code changes were made, only docs).

**Step 4: Review git log**

Run: `git log --oneline -10`
Expected: 9 new commits following conventional commit format.
