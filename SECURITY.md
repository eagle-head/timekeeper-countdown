# Security Policy

## Supported Versions

Only the latest release of each package receives security updates.

| Package                                | Supported |
| -------------------------------------- | --------- |
| `@timekeeper-countdown/core` (latest)  | ✅        |
| `@timekeeper-countdown/react` (latest) | ✅        |
| Older versions                         | ❌        |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

To report a vulnerability, send an email to **ekohn.npm@gmail.com** with:

- A description of the vulnerability and its potential impact
- Steps to reproduce (proof-of-concept code, if possible)
- The affected package(s) and version(s)
- Any suggested fix, if you have one

### What to expect

- **Acknowledgement** within 48 hours confirming receipt of your report
- **Initial assessment** within 5 business days with an estimated timeline for a fix
- **Resolution** as soon as reasonably possible, typically within 30 days for high-severity issues
- Credit in the release notes if you wish (let us know your preferred name or handle)

We will keep you informed throughout the process and coordinate public disclosure with you once a fix is available.

## Scope

This project is a **zero-dependency countdown timer library** with no network access, no storage, and no authentication logic. The attack surface is limited to:

- **Prototype pollution** via user-supplied options or callbacks
- **Denial of service** via malformed input causing tight loops or excessive memory allocation
- **Dependency vulnerabilities** introduced via devDependencies (build-time only; not shipped to consumers)

Issues that are **out of scope**:

- Vulnerabilities in the consumer's own application code
- Issues in transitive runtime dependencies (this library has none)
- Reports that require physical access to the user's machine

## Security Update Process

When a security issue is confirmed:

1. A fix is developed on a private branch
2. A new patch release is published to npm
3. A [GitHub Security Advisory](https://github.com/eagle-head/timekeeper-countdown/security/advisories) is published after the fix is available
4. The changelog entry will reference the advisory

## Preferred Languages

We accept reports in **English** or **Portuguese**.
