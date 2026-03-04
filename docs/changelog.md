# Changelog

## @timekeeper-countdown/core

### 0.2.0

#### Minor Changes

- Rename `onUpdate` callback to `onSnapshot` in `Countdown` high-level API
- Add `onError` callback support to `Countdown`
- Export `Countdown` class from core index
- Add function overloads to all format helpers for better TypeScript DX
- Remove redundant `try-catch` in `safeFormat` and `safeExecute` wrappers

### 0.1.4

#### Patch Changes

- 1724e9b: Add dual CJS+ESM build output for Jest and CJS consumer compatibility

### 0.1.3

#### Patch Changes

- ae97ee8: Sync core and react package versions

### 0.1.2

#### Patch Changes

- 0e60b59: Fix formatMinutes to return decomposed value (0-59) instead of total minutes

### 0.1.1

#### Patch Changes

- Add comprehensive README documentation for core and react packages

### 0.1.0

#### Minor Changes

- Prepare core and react packages for the 0.1.0 React-first release

---

## @timekeeper-countdown/react

### 0.2.0

#### Minor Changes

- Updated dependencies
  - @timekeeper-countdown/core@0.2.0

### 0.1.4

#### Patch Changes

- Updated dependencies [1724e9b]
  - @timekeeper-countdown/core@0.1.4

### 0.1.3

#### Patch Changes

- Updated dependencies [ae97ee8]
  - @timekeeper-countdown/core@0.1.3

### 0.1.2

#### Patch Changes

- aefb6b3: Update @timekeeper-countdown/core dependency to 0.1.2

### 0.1.1

#### Patch Changes

- Add comprehensive README documentation for core and react packages
- Updated dependencies
  - @timekeeper-countdown/core@0.1.1

### 0.1.0

#### Minor Changes

- Prepare core and react packages for the 0.1.0 React-first release

#### Patch Changes

- Updated dependencies
  - @timekeeper-countdown/core@0.1.0
