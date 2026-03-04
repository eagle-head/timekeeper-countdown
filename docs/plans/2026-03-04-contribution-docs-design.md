# Design: Open Source Contribution Documentation

**Date:** 2026-03-04
**Status:** Approved
**Goal:** Enable anyone to contribute to timekeeper-countdown following best practices from top open source libraries (React, Vue, Vite, Vitest).

---

## Context

The project currently has:

- A basic 5-step Contributing section in README.md
- A deploy-docs GitHub Actions workflow
- No CONTRIBUTING.md, CODE_OF_CONDUCT.md, issue templates, or PR templates
- A reference to a non-existent AGENTS.md in README.md
- Changesets for versioning with Conventional Commits convention

## Decisions

- **Language:** English (standard for global open source reach)
- **Code of Conduct:** Contributor Covenant v2.1
- **Commit convention:** Conventional Commits (feat:, fix:, docs:, chore:, etc.)
- **CI:** Full pipeline (lint, typecheck, test, build) on PRs
- **Issue templates:** YAML format (modern GitHub form-based with validation)

## File Structure

```
.github/
├── ISSUE_TEMPLATE/
│   ├── bug_report.yml          # Bug report form with validation
│   ├── feature_request.yml     # Feature request form
│   └── config.yml              # Disable blank issues
├── workflows/
│   ├── ci.yml                  # lint + typecheck + test + build
│   └── deploy-docs.yml         # (existing)
├── PULL_REQUEST_TEMPLATE.md    # PR checklist
└── commit-convention.md        # Conventional Commits documentation
CONTRIBUTING.md                 # Main contributor guide (repo root)
CODE_OF_CONDUCT.md              # Contributor Covenant v2.1 (repo root)
```

## CONTRIBUTING.md Sections

1. **Welcome** — Welcoming tone, link to Code of Conduct
2. **How to Contribute** — Overview of ways to help (issues, PRs, docs, discussions)
3. **Development Setup** — Prerequisites (Node 18+, npm), install steps, key scripts
4. **Project Structure** — Overview of packages/core, packages/react, docs
5. **Development Workflow** — Branch from main, make changes, test, submit PR
6. **Commit Convention** — Summary of Conventional Commits + link to full doc
7. **Pull Request Guidelines** — What to include, how to describe, Changesets usage
8. **Code Style** — ESLint, Prettier, TypeScript strict mode (tools already configured)
9. **Testing** — How to run tests, test location, mocking patterns
10. **Reporting Issues** — How to report bugs and request features effectively

## Issue Templates

### Bug Report (`bug_report.yml`)

Fields:

- **Bug description** (textarea, required)
- **Reproduction steps** (textarea, required — numbered steps)
- **Expected behavior** (textarea, required)
- **System information** (textarea — Node version, OS, browser, package version)
- **Affected package** (dropdown: `@timekeeper-countdown/core`, `@timekeeper-countdown/react`, Both)
- **Validation checklist** (checkboxes: read CoC, searched duplicates, tested latest version)

### Feature Request (`feature_request.yml`)

Fields:

- **Problem or motivation** (textarea, required)
- **Proposed solution** (textarea, required)
- **Alternatives considered** (textarea, optional)
- **Related package** (dropdown: core, react, new adapter, docs)
- **Checklist** (checkboxes: read CoC, searched duplicates)

### config.yml

- Disable blank issues
- Add external link for "Questions / Help" pointing to GitHub Discussions

## PR Template

**Sections:**

- Description (what and why)
- Type of change (bug fix / feature / docs / refactor / breaking change)
- How to test

**Checklist:**

- [ ] Linked to an issue (`fixes #...`)
- [ ] Tests added/updated
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] Follows commit convention
- [ ] Changeset added (if user-facing change)

## CI Workflow

**Trigger:** push to `main` + pull_request to `main`

**Jobs (all on ubuntu-latest with npm cache):**

| Job       | Commands                                | Node Matrix |
| --------- | --------------------------------------- | ----------- |
| lint      | `npm run lint` + `npm run format:check` | 20          |
| typecheck | `npm run typecheck`                     | 20          |
| test      | `npm run test`                          | 18, 20      |
| build     | `npm run build`                         | 20          |

## Code of Conduct

Contributor Covenant v2.1 with Eduardo Kohn as enforcement contact.

## README.md Updates

- Replace the basic Contributing section with a link to CONTRIBUTING.md
- Remove reference to non-existent AGENTS.md

## Commit Convention Document

Standalone `.github/commit-convention.md` documenting:

- Format: `<type>(<scope>): <subject>`
- Types: feat, fix, docs, style, refactor, perf, test, chore, ci, build
- Scopes: core, react, docs, deps
- Rules: imperative mood, no capitalization, no period, max 50 char subject
- Breaking changes: `!` before colon or `BREAKING CHANGE:` footer
- Examples for each type
