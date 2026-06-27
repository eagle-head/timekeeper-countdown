# API Reference

This reference documents the public surface that ships today. The React hook is the primary entry point; helper modules live under the shared core namespace and will continue to exist as future adapters are released.

## React Hook (`@timekeeper-countdown/react`)

```ts
import {
  useCountdown,
  type UseCountdownOptions,
  type UseCountdownResult,
  type UseCountdownControls,
} from '@timekeeper-countdown/react';
```

### `useCountdown(initialSeconds, options?)`

Creates a countdown engine instance and wires it into React state.

#### Parameters

- `initialSeconds: number` – non-negative integer representing the initial duration in seconds. Must be a finite, non-negative integer `≤ Number.MAX_SAFE_INTEGER`; an invalid value (negative, non-integer, `NaN`, or `Infinity`) **throws** at construction (the error propagates from the hook's effect).
- `options?: UseCountdownOptions`
  - `autoStart?: boolean` – start automatically on mount (default `false`).
  - `tickIntervalMs?: number` – polling interval in milliseconds (default `100`).
- `timeProvider?: TimeProvider | (() => number)` – inject a custom clock (`TimeProvider` is exported from `@timekeeper-countdown/core`).
  - `onSnapshot?: (snapshot: CountdownSnapshot) => void` – side effects on every snapshot.
  - `onStateChange?: (state: TimerState, snapshot: CountdownSnapshot) => void` – notified whenever the state machine transitions.
  - `onError?: (error: Error) => void` – capture unexpected engine errors.

Exceptions thrown by your own callbacks — `onSnapshot`, `onStateChange`, and `subscribe` listeners — are **swallowed** (fail-soft): one throwing listener never crashes the timer or stops the others. These callback errors are **not** delivered to `onError`, which is reserved for internal/timer errors only.

#### Returns: `UseCountdownResult`

```ts
interface UseCountdownResult extends UseCountdownControls {
  snapshot: CountdownSnapshot;
  state: TimerState;
  totalSeconds: number;
  parts: CountdownSnapshot['parts'];
  isRunning: boolean;
  isCompleted: boolean;
}

interface UseCountdownControls {
  start(): boolean;
  pause(): boolean;
  resume(): boolean;
  reset(nextInitialSeconds?: number): boolean;
  stop(): boolean;
  setSeconds(value: number): void;
}
```

- `snapshot` always reflects the latest timer state and is safe to read during render.
- `state` mirrors `snapshot.state` for convenience.
- `totalSeconds` is an alias for `snapshot.totalSeconds`.
- `parts` exposes derived units (`minutes`, `hours`, `days`, etc.) as numbers.
- `isRunning` and `isCompleted` are boolean helpers.
- Control methods return `false` when the requested transition is invalid for the current state.
- `reset(value)` and `setSeconds(value)` validate their argument like the constructor: each requires a finite, non-negative integer `≤ Number.MAX_SAFE_INTEGER` and **throws** on an invalid value (negative, non-integer, `NaN`, or `Infinity`).

The hook memoises every method with `useCallback`, so you can pass them directly to event handlers.

### Snapshot & State Types

The React package relies on the countdown engine for its data model. These types are generated from the shared core package and are safe to import directly when you need static typing elsewhere.

```ts
import type { CountdownSnapshot, CountdownParts, TimerState } from '@timekeeper-countdown/core';
```

```ts
interface CountdownSnapshot {
  initialSeconds: number;
  totalSeconds: number;
  parts: CountdownParts;
  state: TimerState;
  isRunning: boolean;
  isCompleted: boolean;
}
```

`TimerState` is a string union with four values: `"IDLE"`, `"RUNNING"`, `"PAUSED"`, `"STOPPED"`. Valid transitions are enforced internally; attempting an invalid transition leaves the timer unchanged and returns `false`.

## Formatting Helpers (`@timekeeper-countdown/core/format`)

Formatting utilities ship with the React package and will be shared across future adapters.

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
} from '@timekeeper-countdown/core/format';
```

- Accept either raw `totalSeconds` (numbers) or any object that implements `totalSeconds` (such as `CountdownSnapshot`).
- Helper functions return zero-padded strings (e.g. `"05"`).
- `Formatter()` instantiates a memoised formatter if you prefer reusing the same instance across renders.

## Testing Utilities (`@timekeeper-countdown/core/testing-utils`)

Use these helpers to drive timers deterministically during tests.

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
} from '@timekeeper-countdown/core/testing-utils';
```

- `createFakeTimeProvider(options?)` – returns a controllable clock with `advance(ms?)`, `set(ms)`, `reset()`, and `getTime()`.
- `toTimeProvider(fake)` – adapts a `FakeTimeProvider` to the read-only `TimeProvider` interface for `CountdownEngine` or `useCountdown`.
- `buildSnapshot(options?)` – fabricates `CountdownSnapshot` objects for unit tests without running an engine.
- `buildSnapshotSequence(options?)` – generates an array of snapshots simulating a descending countdown.
- `assertSnapshotState(snapshot, expected, message?)` – throws if the snapshot is not in the expected `TimerState`.
- `assertSnapshotCompleted(snapshot, message?)` – throws if the countdown is not complete (`isCompleted === false` or `totalSeconds !== 0`).
- `assertRemainingSeconds(snapshot, expected, tolerance?, message?)` – throws if remaining seconds differ beyond the tolerance.
- `TimerState` – re-exported for convenience.

```ts
const fake = createFakeTimeProvider({ startMs: 0, tickMs: 1000 });
const engine = CountdownEngine(5, {
  timeProvider: toTimeProvider(fake),
  tickIntervalMs: 5,
});

engine.start();
fake.advance(3000);

assertRemainingSeconds(engine.getSnapshot(), 2);
assertSnapshotState(engine.getSnapshot(), TimerState.RUNNING);

fake.advance(2000);
assertSnapshotCompleted(engine.getSnapshot());

// Sequence for formatter tests
const sequence = buildSnapshotSequence({ totalSeconds: 4, step: 2, count: 3 });
assertSnapshotState(sequence[0], TimerState.RUNNING);
assertSnapshotCompleted(sequence[2]);
```

These utilities remain part of the shared engine so upcoming adapters can reuse the exact same testing story.
