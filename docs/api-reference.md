# API Reference

This reference covers the full surface of the core engine, helper modules, testing utilities, and the React adapter. The project is delivered as two packages:

- `@timekeeper-countdown/core` – countdown engine, formatter helpers, and test utilities
- `@timekeeper-countdown/react` – React hook built on top of the core engine

All exports use ESM syntax and include TypeScript definitions.

## Core Entry Point (`@timekeeper-countdown/core`)

```ts
import {
  Countdown,
  CountdownEngine,
  TimerState,
  type CountdownInstance,
  type CountdownOptions,
  type CountdownEngineInstance,
  type CountdownEngineOptions,
  type CountdownSnapshot,
  type CountdownParts,
} from '@timekeeper-countdown/core'
```

### `Countdown(initialSeconds, options?)`

High-level helper that wraps the engine, performs input validation, and emits formatted strings for minutes/seconds.

#### Parameters

- `initialSeconds: number` – non-negative integer; validated against `Number.MAX_SAFE_INTEGER`
- `options?: CountdownOptions`
  - `onUpdate?: (minutes: string, seconds: string) => void` – receives zero-padded strings (e.g. `"03"`, `"09"`)
  - `onStateChange?: (state: TimerState) => void`

Both callbacks are optional. They are executed inside `try/catch` so consumer errors do not break the countdown loop.

#### Returns: `CountdownInstance`

```ts
interface CountdownInstance {
  start(): void
  pause(): void
  resume(): void
  reset(nextInitialSeconds?: number): void
  stop(): void
  destroy(): void
  getSnapshot(): CountdownSnapshot
  getCurrentState(): TimerState
  getSeconds(): string
  getMinutes(): string
  getHours(): string
  getDays(): string
  getWeeks(): string
  getYears(): string
}
```

- `start`, `pause`, `resume`, `reset`, `stop`, `destroy` swallow internal engine errors to match legacy behaviour
- `reset(nextInitialSeconds?)` accepts a new initial value (validated like the constructor)
- `getSnapshot()` always returns the latest snapshot produced by the engine

### `CountdownEngine(initialSeconds, options?)`

Lower-level engine that exposes the entire state machine, raw numbers, and subscription API.

#### Parameters

- `initialSeconds: number`
- `options?: CountdownEngineOptions`
  - `onSnapshot?: (snapshot: CountdownSnapshot) => void`
  - `onStateChange?: (state: TimerState, snapshot: CountdownSnapshot) => void`
  - `onError?: (error: Error) => void`
  - `timeProvider?: TimeProvider | (() => number)` – inject a custom clock (see [`createFakeTimeProvider`](#testing-utilities))
  - `tickIntervalMs?: number` – polling interval for the internal scheduler (defaults to `100`)

#### Returns: `CountdownEngineInstance`

```ts
interface CountdownEngineInstance {
  start(): boolean
  pause(): boolean
  resume(): boolean
  reset(nextInitialSeconds?: number): boolean
  stop(): boolean
  setSeconds(value: number): void
  getSnapshot(): CountdownSnapshot
  subscribe(listener: (snapshot: CountdownSnapshot) => void): { unsubscribe(): void }
  destroy(): void
}
```

- `start/pause/resume/reset/stop` return `false` when the transition is invalid for the current state
- `setSeconds` immediately replaces the remaining time and updates the snapshot (without starting the timer)
- `subscribe` instantly invokes the listener with the current snapshot and returns an `unsubscribe` handle

### `CountdownSnapshot`

```ts
interface CountdownSnapshot {
  initialSeconds: number
  totalSeconds: number
  parts: CountdownParts
  state: TimerState
  isRunning: boolean
  isCompleted: boolean
}
```

- `parts` breaks time into `years`, `weeks`, `days`, `hours`, `minutes`, `seconds`, `totalDays`, `totalHours`, and `totalMinutes`
- `isCompleted` is `true` only when `totalSeconds === 0` and the state machine has transitioned to `TimerState.STOPPED`

### `TimerState`

```ts
const TimerState = {
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  STOPPED: 'STOPPED',
} as const

type TimerState = typeof TimerState[keyof typeof TimerState]
```

Valid transitions:

- `IDLE → RUNNING | IDLE | STOPPED`
- `RUNNING → PAUSED | STOPPED | IDLE`
- `PAUSED → RUNNING | STOPPED | IDLE`
- `STOPPED → IDLE | STOPPED`

### Errors and Validation

- `initialSeconds` must be a finite, non-negative integer ≤ `Number.MAX_SAFE_INTEGER`
- `timeProvider` must be a function or an object exposing `now(): number`
- Listener errors are caught and reported through `onError` (engine) or ignored (high-level helper)

## Format Helpers (`@timekeeper-countdown/core/format`)

```ts
import {
  Formatter,
  defaultFormatter,
  formatTime,
  formatMinutes,
  formatSeconds,
  formatHours,
  formatDays,
  formatWeeks,
  formatYears,
  type FormatTarget,
} from '@timekeeper-countdown/core/format'
```

- Accept raw numbers or any object with a `totalSeconds` property (`CountdownSnapshot`, `CountdownInstance#getSnapshot()` etc.)
- All helpers return zero-padded strings (e.g. `"05"`)
- `Formatter()` creates an isolated formatter instance in case you need custom memoization

Example:

```ts
const { minutes, seconds } = formatTime(snapshot)
const days = formatDays(snapshot.totalSeconds)
```

## Testing Utilities (`@timekeeper-countdown/core/testing`)

```ts
import {
  createFakeTimeProvider,
  toTimeProvider,
  buildSnapshot,
  buildSnapshotSequence,
  assertSnapshotState,
  assertSnapshotCompleted,
  assertRemainingSeconds,
  TimerState,
} from '@timekeeper-countdown/core/testing'
```

- `createFakeTimeProvider({ startMs?, tickMs?, highResolution? })` – deterministic clock with `advance()`, `set()`, and `reset()` helpers
- `toTimeProvider(fake)` – converts the fake provider to a `TimeProvider` compatible with `CountdownEngine`
- `buildSnapshot` / `buildSnapshotSequence` – fabricate snapshot data for tests
- Assertion helpers throw when the snapshot does not match the expectation

## React Adapter (`@timekeeper-countdown/react`)

```ts
import {
  useCountdown,
  type UseCountdownOptions,
  type UseCountdownResult,
  type UseCountdownControls,
} from '@timekeeper-countdown/react'
```

### `useCountdown(initialSeconds, options?)`

A React hook that manages a `CountdownEngine` instance for you and keeps the latest snapshot in state.

#### Options

`UseCountdownOptions` extends `CountdownEngineOptions` (minus the callback props) and adds:

- `autoStart?: boolean` – start automatically on mount
- `onSnapshot?: (snapshot: CountdownSnapshot) => void`
- `onStateChange?: (state: TimerState, snapshot: CountdownSnapshot) => void`
- `onError?: (error: Error) => void`

#### Returned shape

```ts
interface UseCountdownResult extends UseCountdownControls {
  snapshot: CountdownSnapshot
  state: TimerState
  totalSeconds: number
  parts: CountdownSnapshot['parts']
  isRunning: boolean
  isCompleted: boolean
}
```

`UseCountdownControls` exposes the same control methods as the engine (`start`, `pause`, `resume`, `reset`, `stop`, `setSeconds`). All functions are memoised, and the hook disposes the engine on unmount.

Example:

```tsx
const { parts, isRunning, start, pause, reset } = useCountdown(1500, {
  autoStart: false,
  onStateChange: (state) => console.log('state:', state),
})
```

React Testing Library users can pair the hook with `createFakeTimeProvider` by passing `timeProvider` to the options.

## Environment Notes

- Requires Node.js ≥ 16 or any modern browser with `setInterval`
- Bundles are ESM; use a bundler or a native `import` in supporting browsers
- No runtime dependencies; React adapter declares `react`/`react-dom` as peer deps only

Refer back to the [Advanced Usage](advanced-usage.md) guide for tips on plugging custom time providers, coordinating multiple timers, and formatting snapshots.
