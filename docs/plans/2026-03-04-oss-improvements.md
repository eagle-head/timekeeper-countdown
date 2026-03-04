# OSS Improvements — Vue Roadmap, CI Fix, README Badges

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix three issues identified in the OSS structure: Vue status in the roadmap, deploy-docs running without waiting for CI, and README missing badges/motivation.

**Architecture:** Three independent changes to docs and configuration files. No code changes.

**Tech Stack:** Markdown, GitHub Actions YAML, Shields.io badges

---

### Task 1: Vue → Planned in Roadmap

**Files:**

- Modify: `docs/roadmap.md:10`

**Step 1: Change Vue status**

In `docs/roadmap.md`, in the planned packages table, change the Vue row from:

```markdown
| `@timekeeper-countdown/vue` | In development | Vue composable with the same snapshot contract. |
```

To:

```markdown
| `@timekeeper-countdown/vue` | Planned | Vue composable with the same snapshot contract. |
```

**Step 2: Verify the file**

Open `docs/roadmap.md` and confirm the table now only has `Planned` and `In research` — no `In development`.

**Step 3: Commit**

```bash
git add docs/roadmap.md
git commit -m "docs: set vue adapter status to Planned"
```

---

### Task 2: Fix deploy-docs to wait for CI

**Context:** `deploy-docs.yml` currently triggers on `push` to `main` independently. If someone pushes broken code + a docs change, the documentation could be deployed even with CI failing. The fix is to add `workflow_run` so the deploy only runs after CI completes successfully.

**Tradeoff:** The current workflow uses `paths` to only trigger when `docs/**`, `package.json`, or `package-lock.json` change. `workflow_run` does not support `paths` filtering, so the docs deploy will now trigger after every CI run on `main`, even for code-only pushes. This is acceptable for a project this size — the build is fast and GitHub Actions minutes are free for public repositories. The docs build will simply be a no-op when nothing changed.

**Files:**

- Modify: `.github/workflows/deploy-docs.yml`

**Step 1: Replace the workflow trigger**

Replace the current `on:` block:

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'docs/**'
      - 'package.json'
      - 'package-lock.json'

  workflow_dispatch:
```

With:

```yaml
on:
  workflow_run:
    workflows: ['CI']
    types: [completed]
    branches: [main]

  workflow_dispatch:
```

**Why workflow_run and not needs:** `needs` only works between jobs in the same file. `workflow_run` is the correct mechanism for dependencies between separate workflow files.

**Step 2: Add a success condition to the build job**

`workflow_run` triggers on both success and failure. A condition must be added to the `build` job so it only runs when CI passed.

Find the `build:` job in `deploy-docs.yml` and add the condition right after `runs-on`:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    if: ${{ github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success' }}
```

The `workflow_dispatch` condition ensures manual runs continue to work without depending on CI.

**Step 3: Pin the checkout to the exact commit CI validated**

In the Checkout step, add `ref` to ensure the deploy uses the same commit CI approved (avoids a race condition if another push lands between CI completing and deploy starting):

```yaml
- name: Checkout
  uses: actions/checkout@v4
  with:
    ref: ${{ github.event.workflow_run.head_sha || github.sha }}
```

The `|| github.sha` fallback ensures `workflow_dispatch` runs still work (where `workflow_run.head_sha` is not available).

**Step 4: Verify the final file structure**

The complete file should look like:

```yaml
name: Deploy Docs

on:
  workflow_run:
    workflows: ['CI']
    types: [completed]
    branches: [main]

  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    if: ${{ github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success' }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.workflow_run.head_sha || github.sha }}

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Install dependencies
        run: npm ci

      - name: Build docs
        run: npm run docs:build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Step 5: Fix CLAUDE.md**

CLAUDE.md states `No CI/CD is configured — builds, tests, and releases are all manual`. This is incorrect — CI is configured. Releases are manual (via Changesets), but CI is not.

In `CLAUDE.md`, under the `## Gotchas` section, replace:

```markdown
- No CI/CD is configured — builds, tests, and releases are all manual.
```

With:

```markdown
- Releases are manual — use Changesets (`npm run changeset` → `npm run version` → `npm run release`).
```

**Step 6: Commit**

```bash
git add .github/workflows/deploy-docs.yml CLAUDE.md
git commit -m "ci: make deploy-docs depend on CI workflow success"
```

---

### Task 3: README — Badges and motivation

**Files:**

- Modify: `README.md`

**Context:** The current README has no badges (npm, CI status, license) and does not answer the question "why use this over react-countdown or similar libraries". These are the first two things a developer looks for when landing from npm or GitHub.

**Step 1: Add badges between the title and the welcome paragraph**

In `README.md`, insert the badges block between `# Timekeeper Countdown ⏳` (line 1) and the `Welcome to the monorepo...` paragraph (line 3). Add a blank line before and after the badges:

```markdown
[![npm](https://img.shields.io/npm/v/@timekeeper-countdown/react?label=react&color=blue)](https://www.npmjs.com/package/@timekeeper-countdown/react)
[![npm](https://img.shields.io/npm/v/@timekeeper-countdown/core?label=core&color=blue)](https://www.npmjs.com/package/@timekeeper-countdown/core)
[![CI](https://github.com/eagle-head/timekeeper-countdown/actions/workflows/ci.yml/badge.svg)](https://github.com/eagle-head/timekeeper-countdown/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

**Step 2: Add "Why Timekeeper?" section before "## Packages"**

```markdown
## Why Timekeeper?

Most countdown libraries either lock you into a framework or sacrifice precision for simplicity. Timekeeper ships a **zero-dependency engine** that any framework can wrap, plus a React hook that uses it today.

- **Wall-clock precision** — tracks elapsed time via `performance.now`, not tick counting. Pausing and resuming never drifts.
- **Snapshot-driven API** — every tick delivers an immutable snapshot with pre-calculated `parts` (hours, minutes, seconds) and boolean helpers (`isRunning`, `isPaused`). No manual math.
- **Testable by design** — `@timekeeper-countdown/core/testing-utils` ships a fake time provider so you can unit-test countdown logic without `setTimeout` hacks.
- **Framework-agnostic core** — the engine has zero runtime dependencies. React today, Angular/Vue/Svelte adapters coming.
```

**Step 3: Verify the README renders correctly**

Open the file and confirm:

1. The 4 badges appear on the line after the title
2. The "Why Timekeeper?" section appears before "## Packages"
3. No broken links

**Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add npm/CI badges and Why Timekeeper section to README"
```

---

### Task 4: Final Verification

**Step 1: Confirm the 3 issues are fixed**

```bash
# 1. Is Vue set to Planned?
grep "vue" docs/roadmap.md

# 2. Does deploy-docs have workflow_run?
grep "workflow_run" .github/workflows/deploy-docs.yml

# 3. Does README have badges?
head -10 README.md
```

**Expected:**

1. `| \`@timekeeper-countdown/vue\` | Planned |`
2. `workflow_run:` present
3. 4 badge lines after the title

**Step 2: Final log**

```bash
git log --oneline -5
```

Expected: 3 new commits following conventional commit format.
