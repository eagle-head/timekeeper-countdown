# Core Usage

Use `@timekeeper-countdown/core` directly when building for Node.js, vanilla JavaScript, or a framework without a dedicated adapter.

---

## Installation

```bash
npm install @timekeeper-countdown/core
```

---

## High-level API (`Countdown`)

`Countdown` wraps the lower-level engine and exposes convenient callbacks and methods.

```ts
import { Countdown, TimerState } from '@timekeeper-countdown/core';
import { formatTime } from '@timekeeper-countdown/core/format';

const countdown = Countdown(300, {
  onSnapshot: snapshot => {
    const { minutes, seconds } = formatTime(snapshot);
    console.log(`${minutes}:${seconds}`);
  },
  onStateChange: state => {
    if (state === TimerState.STOPPED) {
      console.log('Finished!');
    }
  },
  onError: error => {
    console.error('Timer failure', error);
  },
});

countdown.start();
```

Available methods:

```ts
countdown.start();                   // void (the low-level CountdownEngine returns boolean)
countdown.pause();
countdown.resume();
countdown.reset(nextInitialSeconds?);
countdown.stop();
countdown.destroy();                 // dispose timers and listeners

countdown.getSnapshot();             // CountdownSnapshot
countdown.getCurrentState();         // TimerState
countdown.getMinutes();              // string e.g. "05"
```

---

## Low-level API (`CountdownEngine`)

`CountdownEngine` gives you fine-grained control and a `subscribe` API.

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

Fine-grained control methods:

- `start`, `pause`, `resume`, `reset(nextInitialSeconds?)`, `stop`, `setSeconds(value)`, `destroy`
- `setSeconds(value)`, `reset(value)`, and `CountdownEngine(value)` require a non-negative integer; an invalid value (negative, non-integer, `NaN`, `Infinity`, or above `Number.MAX_SAFE_INTEGER`) throws.
- `getSnapshot()` – returns the latest `CountdownSnapshot`.
- `subscribe(listener)` – emits the current snapshot immediately and on every tick.

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

## Snapshot Structure

```ts
interface CountdownSnapshot {
  initialSeconds: number; // starting value
  totalSeconds: number;   // remaining seconds, floor-clamped
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

## Testing Utilities

The package ships helpers under `@timekeeper-countdown/core/testing-utils` for writing deterministic tests without real timers. See the [API Reference](api-reference.md#testing-utilities-timekeeper-countdowncoretesting-utils) for full signatures and examples.

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
