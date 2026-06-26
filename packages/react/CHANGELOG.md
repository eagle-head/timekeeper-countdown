# Changelog

All notable changes to `@timekeeper-countdown/react` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-06-26

### Changed

- The `useCountdown` hook inherits the engine hardening (see `@timekeeper-countdown/core` 0.3.0): a hostile `timeProvider` (`NaN`/`Infinity`/backward clock) can no longer corrupt the countdown, `tickIntervalMs` is sanitized, and the time decomposition is lossless. **Behavior change:** the hook's `setSeconds(value)` and `reset(value)` now **throw** on an invalid argument (negative / non-finite / non-integer / out-of-range) instead of silently coercing it.
- Bumped `@timekeeper-countdown/core` to `^0.3.0`.

## [0.2.0] - 2026-03-03

### Changed

- Bumped `@timekeeper-countdown/core` to `^0.2.0`.

## [0.1.4] - 2026-02-17

### Changed

- Bumped `@timekeeper-countdown/core` to `^0.1.4`.

## [0.1.3] - 2026-02-17

### Changed

- Bumped `@timekeeper-countdown/core` to `^0.1.3`.

## [0.1.2] - 2026-02-17

### Changed

- Updated the `@timekeeper-countdown/core` dependency to 0.1.2.

## [0.1.1] - 2025-10-07

### Added

- Comprehensive README documentation.

### Changed

- Bumped `@timekeeper-countdown/core` to `^0.1.1`.

## [0.1.0] - 2025-10-07

### Added

- Initial React adapter (`useCountdown`) for the 0.1.0 React-first release.
