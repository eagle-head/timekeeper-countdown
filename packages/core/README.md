# @timekeeper-countdown/core

Lightweight countdown engine used by Timekeeper Countdown. This package exposes the finite-state machine, snapshot APIs, formatting helpers, and testing utilities that power the React hook and future framework adapters.

- Written in TypeScript with zero runtime dependencies.
- Ships modern ESM bundles and type definitions.
- Designed to run in browsers, Node.js, or custom runtimes.
- Tested with deterministic fake timers for reliable behavior.

> **Looking for the React hook?** Install [`@timekeeper-countdown/react`](https://www.npmjs.com/package/@timekeeper-countdown/react) for an idiomatic React API that wraps this engine.

---

## Installation

```bash
npm install @timekeeper-countdown/core
```

The published bundle is pure ESM. When targeting CommonJS environments use a bundler that understands `type: "module"` packages.

Supported runtimes:

- Node.js 22+
- Modern browsers (ES2022 modules)

---

## Quick Start

### High-level helper (`Countdown`)

```ts
import { Countdown, TimerState } from '@timekeeper-countdown/core';
import { formatTime } from '@timekeeper-countdown/core/format';

const countdown = Countdown(300, {
  onSnapshot: snapshot => {
    const { minutes, seconds } = formatTime(snapshot);
    timerElement.textContent = `${minutes}:${seconds}`;
  },
  onStateChange: state => {
    if (state === TimerState.STOPPED) {
      console.log('Finished!');
    }
  },
  onError: error => {
    console.error('Countdown error:', error);
  },
});

countdown.start(); // Begin the countdown
```

`Countdown` wraps the lower-level engine and returns convenient methods:

```ts
countdown.start();                   // boolean (false when invalid transition)
countdown.pause();
countdown.resume();
countdown.reset(nextInitialSeconds?);
countdown.stop();
countdown.destroy();                 // dispose timers and listeners

countdown.getSnapshot();             // CountdownSnapshot
countdown.getCurrentState();         // TimerState
countdown.getMinutes();              // string e.g. "05"
```

### Low-level engine (`CountdownEngine`)

```ts
import { CountdownEngine, TimerState } from '@timekeeper-countdown/core';

const engine = CountdownEngine(90, {
  tickIntervalMs: 50,
  onSnapshot: snapshot => {
    console.log(snapshot.totalSeconds);
  },
  onStateChange: (state, snapshot) => {
    if (state === TimerState.STOPPED && snapshot.isCompleted) {
      console.log('Done!');
    }
  },
  onError: error => {
    console.error('Timer failure', error);
  },
});

engine.start();
```

`CountdownEngine` exposes fine-grained control:

- `start`, `pause`, `resume`, `reset(nextInitialSeconds?)`, `stop`, `setSeconds(value)`, `destroy`
- The constructor, `reset(value)`, and `setSeconds(value)` require a non-negative integer (≤ `Number.MAX_SAFE_INTEGER`) and **throw** on an invalid value (negative, non-integer, `NaN`, or `Infinity`).
- `getSnapshot()` returns the latest snapshot.
- `subscribe(listener)` emits the current snapshot immediately and on every tick.

Exceptions thrown by your own callbacks — `onSnapshot`, `onStateChange`, and `subscribe` listeners — are **swallowed** (fail-soft): one throwing listener never crashes the timer or stops the other listeners. These callback errors are **not** delivered to `onError`; `onError` is reserved for internal/timer errors only.

Snapshot structure:

```ts
interface CountdownSnapshot {
  initialSeconds: number; // starting value
  totalSeconds: number; // remaining seconds, floor-clamped
  parts: {
    years: number;
    weeks: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalDays: number;
    totalHours: number;
    totalMinutes: number;
  };
  state: TimerState; // IDLE | RUNNING | PAUSED | STOPPED
  isRunning: boolean;
  isCompleted: boolean;
}
```

---

## State Transitions

The engine enforces a strict state machine. Invalid transitions are silently ignored and return `false`.

```text
           start()
  IDLE ──────────────► RUNNING
   ▲                    │    │
   │                    │    │
   │   reset()    pause()   stop() / complete()
   │                    │    │
   │                    ▼    │
   │                 PAUSED  │
   │                    │    │
   │   reset()          │    │
   │◄───────────────────┘    │
   │                         │
   │   reset()               ▼
   │◄──────────────────── STOPPED
```

| From      | Action     | To        |
| --------- | ---------- | --------- |
| `IDLE`    | `start()`  | `RUNNING` |
| `RUNNING` | `pause()`  | `PAUSED`  |
| `RUNNING` | `reset()`  | `IDLE`    |
| `RUNNING` | `stop()`   | `STOPPED` |
| `PAUSED`  | `resume()` | `RUNNING` |
| `PAUSED`  | `reset()`  | `IDLE`    |
| `PAUSED`  | `stop()`   | `STOPPED` |
| `STOPPED` | `reset()`  | `IDLE`    |

---

## Formatting Helpers

Use the helpers exported at `@timekeeper-countdown/core/format` to avoid reimplementing `padStart` logic.

```ts
import { formatTime, formatMinutes, formatSeconds, Formatter } from '@timekeeper-countdown/core/format';

const snapshot = engine.getSnapshot();

formatTime(snapshot); // { minutes: "01", seconds: "30" }
formatMinutes(snapshot); // "01"

const formatter = Formatter();
formatter.formatHours(snapshot); // memoised string helpers
```

All helpers accept either a snapshot or any object that exposes `totalSeconds`.

---

## Testing Utilities

The package includes utilities under `@timekeeper-countdown/core/testing-utils` to make unit tests deterministic.

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

### `createFakeTimeProvider(options?)`

Provides a controllable clock for deterministic testing.

```ts
interface FakeTimeOptions {
  startMs?: number;         // default: 0
  tickMs?: number;          // default: 1000 — default step for advance()
  highResolution?: boolean; // default: true
}

interface FakeTimeProvider extends TimeProvider {
  advance(ms?: number): number; // advances by ms (or tickMs if omitted), returns current time
  set(ms: number): number;      // sets clock to absolute value, returns current time
  reset(): number;              // resets to startMs, returns current time
  getTime(): number;            // returns current time without advancing
  now(): number;                // same as getTime (inherited from TimeProvider)
  isHighResolution: boolean;
  type: 'fake';
}

function createFakeTimeProvider(options?: FakeTimeOptions): FakeTimeProvider;
```

- Negative or non-finite values are clamped to `0`.
- Values above `Number.MAX_SAFE_INTEGER` are clamped to `Number.MAX_SAFE_INTEGER`.
- `advance()` without a parameter uses `tickMs` as the default step.

### `toTimeProvider(fake)`

```ts
function toTimeProvider(fake: FakeTimeProvider): TimeProvider;
```

Converts a `FakeTimeProvider` to a read-only `TimeProvider`, used to pass to `CountdownEngine` or `useCountdown`.

### `buildSnapshot(options?)`

```ts
interface SnapshotOptions {
  initialSeconds?: number; // fallback: totalSeconds, then 0
  totalSeconds?: number;   // fallback: initialSeconds, then 0
  state?: TimerState;      // fallback: IDLE if totalSeconds > 0, else STOPPED
}

function buildSnapshot(options?: SnapshotOptions): CountdownSnapshot;
```

```ts
const snapshot = buildSnapshot({ totalSeconds: 90, state: TimerState.RUNNING });
// snapshot.parts.minutes === 1
// snapshot.parts.seconds === 30
// snapshot.isRunning === true
```

### `buildSnapshotSequence(options?)`

```ts
interface SequenceOptions extends SnapshotOptions {
  step?: number;  // default: 1 — decrement per snapshot
  count?: number; // default: 1 — number of snapshots
}

function buildSnapshotSequence(options?: SequenceOptions): CountdownSnapshot[];
```

Generates `count` snapshots, decrementing `totalSeconds` by `step` each iteration. The last snapshot with `remaining === 0` gets `state: STOPPED`; all others get `state: RUNNING`.

```ts
const sequence = buildSnapshotSequence({ totalSeconds: 4, step: 2, count: 3 });
// sequence[0].totalSeconds === 4  (RUNNING)
// sequence[1].totalSeconds === 2  (RUNNING)
// sequence[2].totalSeconds === 0  (STOPPED)
```

### `assertSnapshotState(snapshot, expected, message?)`

```ts
function assertSnapshotState(
  snapshot: CountdownSnapshot,
  expected: TimerState,
  message?: string // default: "Unexpected countdown state"
): void;
```

### `assertSnapshotCompleted(snapshot, message?)`

```ts
function assertSnapshotCompleted(
  snapshot: CountdownSnapshot,
  message?: string // default: "Countdown should be completed"
): void;
```

Throws if `snapshot.isCompleted === false` OR `snapshot.totalSeconds !== 0`.

### `assertRemainingSeconds(snapshot, expected, tolerance?, message?)`

```ts
function assertRemainingSeconds(
  snapshot: CountdownSnapshot,
  expected: number,
  tolerance?: number, // default: 0
  message?: string    // default: "Unexpected remaining seconds"
): void;
```

Throws if `Math.abs(snapshot.totalSeconds - Math.floor(expected)) > tolerance` or if `expected` is not a finite number.

```ts
assertRemainingSeconds(snapshot, 5);       // exact
assertRemainingSeconds(snapshot, 5, 0.5); // accepts 4.5–5.5
```

### `TimerState` re-export

`TimerState` is re-exported via `testing-utils`, avoiding a double import:

```ts
// Instead of two separate imports:
import { TimerState } from '@timekeeper-countdown/core';
import { buildSnapshot } from '@timekeeper-countdown/core/testing-utils';

// You can import everything from one place:
import { buildSnapshot, TimerState } from '@timekeeper-countdown/core/testing-utils';
```

---

## Custom Time Providers

`CountdownEngine` accepts either:

- A function: `() => number` returning milliseconds.
- An object implementing the `TimeProvider` interface: `{ now(): number; isHighResolution: boolean; type: string }`.

This allows plugging in custom schedulers or synchronizing multiple engines.

```ts
const provider = {
  now: () => performance.now(),
  isHighResolution: true,
  type: 'custom',
};
CountdownEngine(60, { timeProvider: provider });
```

Constructing with an invalid `timeProvider` — anything that is neither a function nor an object exposing a `now(): number` method — **throws** at construction (and that error propagates from `useCountdown`'s effect).

Every time provider — the default one and any custom provider you supply — is wrapped in a finite, non-decreasing guard, so a `NaN`/`Infinity`/backward clock reading (from NTP, DST, or sleep-wake, or a buggy custom provider) is repaired to the last good value, and remaining seconds is always clamped to `[0, initialValue]`. A provider whose `now()` *throws* is not repaired; the error routes to `onError` instead.

---

## TypeScript Support

All exports are fully typed. Useful entry points:

```ts
import type {
  CountdownSnapshot,
  CountdownEngineOptions,
  CountdownEngineInstance,
  TimerState,
} from '@timekeeper-countdown/core';
```

---

## Documentation & Examples

- Monorepo overview: [GitHub repository](https://github.com/eagle-head/timekeeper-countdown)
- React hook guide: [`@timekeeper-countdown/react` README](https://github.com/eagle-head/timekeeper-countdown/tree/main/packages/react#readme)
- Complete docs site (guides, API reference, roadmap): <https://eagle-head.github.io/timekeeper-countdown/>

---

## Contributing

We welcome contributions! Please read our [Contributing Guide](https://github.com/eagle-head/timekeeper-countdown/blob/main/CONTRIBUTING.md) to get started.

By participating in this project, you agree to abide by our [Code of Conduct](https://github.com/eagle-head/timekeeper-countdown/blob/main/CODE_OF_CONDUCT.md).

---

## License

MIT © [Eduardo Kohn](https://www.linkedin.com/in/eduardo-kohn-56817b195/)
