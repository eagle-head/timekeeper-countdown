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

- Node.js 18+
- Modern browsers (ES2022 modules)

---

## Quick Start

### High-level helper (`Countdown`)

```ts
import { Countdown, TimerState } from '@timekeeper-countdown/core';

const countdown = Countdown(300, {
  onUpdate: (minutes, seconds) => {
    timerElement.textContent = `${minutes}:${seconds}`;
  },
  onStateChange: state => {
    if (state === TimerState.STOPPED) {
      console.log('Finished!');
    }
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
- `getSnapshot()` returns the latest snapshot.
- `subscribe(listener)` emits the current snapshot immediately and on every tick.

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
  assertSnapshotState,
} from '@timekeeper-countdown/core/testing-utils';

const fake = createFakeTimeProvider({ startMs: 0, tickMs: 1000 });
const engine = CountdownEngine(5, {
  timeProvider: toTimeProvider(fake),
  tickIntervalMs: 5,
});

engine.start();
fake.advance(3000);

expect(engine.getSnapshot().totalSeconds).toBe(2);

const snapshot = buildSnapshot({ totalSeconds: 42 });
assertSnapshotState(snapshot, 'RUNNING');
```

Utilities include:

- `createFakeTimeProvider` / `toTimeProvider` for manual clock control.
- `buildSnapshot`, `assertSnapshotState` helpers for quick snapshot fabrication.

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

Issues and pull requests are welcome. Please review the [repository guidelines](https://github.com/eagle-head/timekeeper-countdown/blob/main/AGENTS.md) for more details and run:

```bash
npm run lint --workspaces
npm run test --workspaces
npm run typecheck --workspaces
```

before submitting changes.

---

## License

MIT © [Eduardo Kohn](https://www.linkedin.com/in/eduardo-kohn-56817b195/)
