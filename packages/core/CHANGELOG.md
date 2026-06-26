# Changelog

All notable changes to `@timekeeper-countdown/core` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-06-26

### Changed

- The unit breakdown (`years`/`weeks`/`days`/…, the standalone `formatDays`/`formatWeeks`/`formatYears`, and `getDays`/`getWeeks`/`getYears`) is now computed by a single lossless successive-subtraction ladder (year = 365 days, week = 7 days), so the parts always reconstruct the total. **Behavior change:** values around the 52-week / 365-day boundaries are now corrected — e.g. 364 days no longer renders as all-zero.
- `CountdownEngine.setSeconds(n)` now validates its argument like the constructor and `reset(n)`: it **throws** on a negative / non-finite / non-integer / out-of-range value instead of silently coercing it. Valid values behave as before.
- A single canonical `decompose()` is now shared by the engine, the formatters, and the published testing utilities (removing three divergent copies).

### Fixed

- A hostile `timeProvider` can no longer corrupt the countdown. Every provider (default or caller-supplied) is wrapped in a monotonic, finite-enforcing guard, so a `NaN`/`Infinity`/backward clock reading (NTP/DST/sleep-wake, or a buggy custom provider) is repaired to the last good value instead of producing a `NaN` snapshot, a runaway timer that never completes, a countdown that counts up, or a spurious instant completion. The interval also clamps remaining time to `[0, initialValue]`.
- A non-finite or non-positive `tickIntervalMs` now falls back to the 100 ms default instead of reaching `setInterval` as `NaN`/`Infinity` (which degenerated into a ~0 ms CPU tight-loop).

## [0.2.0] - 2026-03-03

### Changed

- Renamed `onUpdate` to `onSnapshot`, added an `onError` callback, and exported the `Countdown` façade.

## [0.1.4] - 2026-02-17

### Added

- Dual CJS+ESM build output for Jest and CJS-consumer compatibility.

## [0.1.3] - 2026-02-17

### Changed

- Synced core and react package versions.

## [0.1.2] - 2026-02-17

### Fixed

- `formatMinutes` now returns the decomposed value (0–59) instead of total minutes.

## [0.1.1] - 2025-10-07

### Added

- Comprehensive README documentation for the core and react packages.

## [0.1.0] - 2025-10-07

### Added

- Initial core package for the 0.1.0 React-first release.
