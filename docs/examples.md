# Examples

Copy-and-paste snippets for `@timekeeper-countdown/react`. When new framework adapters ship we will add dedicated examples for them as well.

## Basic Timer Card

```tsx
import { useCountdown } from '@timekeeper-countdown/react';
import { formatTime } from '@timekeeper-countdown/core/format';

export function TimerCard() {
  const countdown = useCountdown(60);
  const clock = formatTime(countdown.snapshot);

  return (
    <div>
      <p>
        {clock.minutes}:{clock.seconds}
      </p>
      <button onClick={countdown.start} disabled={countdown.isRunning}>
        Start
      </button>
      <button onClick={countdown.pause} disabled={!countdown.isRunning}>
        Pause
      </button>
      <button onClick={countdown.reset}>Reset</button>
    </div>
  );
}
```

## Form-Controlled Duration

Durations must be non-negative integers — `setSeconds`/`reset` **throw** on a negative, non-integer, `NaN`, or `Infinity` value (see the [API Reference](api-reference.md#parameters)). Sanitize the raw `<input>` value at the boundary so a decimal like `1.5` can never reach the engine.

```tsx
import { useState } from 'react';
import { useCountdown } from '@timekeeper-countdown/react';

// Coerce any raw input into a safe, non-negative integer.
const toSafeSeconds = (raw: string) => Math.max(0, Math.floor(Number(raw) || 0));

function AdjustableCountdown() {
  const [seconds, setSeconds] = useState(150);
  const countdown = useCountdown(seconds, { autoStart: false });

  return (
    <section>
      <label>
        Seconds
        <input type="number" value={seconds} onChange={event => setSeconds(toSafeSeconds(event.target.value))} />
      </label>

      <div>
        <button onClick={countdown.start}>Start</button>
        <button onClick={countdown.pause}>Pause</button>
        <button onClick={() => countdown.reset(Math.max(0, Math.floor(seconds)))}>Apply</button>
      </div>

      <p>{countdown.totalSeconds}s remaining</p>
    </section>
  );
}
```

## Auto-Chaining Phases

```tsx
import { useEffect } from 'react';
import { useCountdown } from '@timekeeper-countdown/react';

function TwoStageFlow() {
  const intro = useCountdown(15, { autoStart: true });
  const main = useCountdown(90);
  const { isCompleted: introCompleted } = intro;
  const { isRunning: mainRunning, start: startMain } = main;

  useEffect(() => {
    if (introCompleted && !mainRunning) {
      startMain();
    }
  }, [introCompleted, mainRunning, startMain]);

  return (
    <div>
      <h3>Intro: {intro.totalSeconds}s</h3>
      <h3>Main Session: {main.totalSeconds}s</h3>
    </div>
  );
}
```

## Testing with @testing-library/react

```tsx
import { useMemo } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCountdown } from '@timekeeper-countdown/react';
import { createFakeTimeProvider, toTimeProvider } from '@timekeeper-countdown/core/testing-utils';

function InspectableTimer() {
  const fake = useMemo(() => createFakeTimeProvider({ startMs: 0 }), []);
  const countdown = useCountdown(5, {
    timeProvider: toTimeProvider(fake),
    tickIntervalMs: 5,
  });

  return (
    <div>
      <output>{countdown.totalSeconds}</output>
      <button onClick={() => fake.advance(1000)}>Advance</button>
    </div>
  );
}

it('advances when the fake clock moves', async () => {
  render(<InspectableTimer />);

  await userEvent.click(screen.getByRole('button', { name: /advance/i }));

  expect(screen.getByText('4')).toBeInTheDocument();
});
```

> **Note:** When testing with `renderHook` or custom render functions that use Vitest fake timers (`vi.useFakeTimers()`), you may need to advance both the fake time provider AND Vitest's internal timers. The fake provider controls **what time the engine reads**; Vitest fake timers control **when `setInterval` callbacks fire**.
>
> ```ts
> vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval'] });
> const fake = createFakeTimeProvider({ startMs: 0 });
>
> // Inside your test:
> act(() => {
>   fake.advance(1000); // engine reads 1s elapsed
>   vi.advanceTimersByTime(1000); // triggers setInterval callbacks
> });
> ```

## Testing with Core Utilities

### Snapshot fabrication for unit tests

```ts
import {
  buildSnapshot,
  buildSnapshotSequence,
  assertSnapshotState,
  assertSnapshotCompleted,
  assertRemainingSeconds,
  TimerState,
} from '@timekeeper-countdown/core/testing-utils';

// Create an isolated snapshot
const idle = buildSnapshot({ totalSeconds: 60 });
assertSnapshotState(idle, TimerState.IDLE);

// Create a completed snapshot
const done = buildSnapshot({ totalSeconds: 0, state: TimerState.STOPPED });
assertSnapshotCompleted(done);

// Verify with tolerance
const mid = buildSnapshot({ totalSeconds: 30, state: TimerState.RUNNING });
assertRemainingSeconds(mid, 30);

// Generate a sequence
const sequence = buildSnapshotSequence({ totalSeconds: 10, step: 5, count: 3 });
// [10s RUNNING, 5s RUNNING, 0s STOPPED]
```

### Deterministic test with engine (plain core, no React)

```ts
import { vi } from 'vitest';
import { CountdownEngine } from '@timekeeper-countdown/core';
import {
  createFakeTimeProvider,
  toTimeProvider,
  assertRemainingSeconds,
  assertSnapshotCompleted,
} from '@timekeeper-countdown/core/testing-utils';

// Deterministic engine tests advance the injected clock AND fire the engine's
// internal interval with your runner's fake timers (Vitest shown), because
// `getSnapshot()` only refreshes on a tick or a state transition.
vi.useFakeTimers();

const fake = createFakeTimeProvider({ startMs: 0, tickMs: 1000 });
const engine = CountdownEngine(5, {
  timeProvider: toTimeProvider(fake),
  tickIntervalMs: 10,
});

engine.start();

fake.advance(3000); // advance the injected clock 3 seconds
vi.advanceTimersByTime(10); // fire the interval so getSnapshot() refreshes
assertRemainingSeconds(engine.getSnapshot(), 2);

fake.advance(2000); // 2 more seconds -> reaches zero
vi.advanceTimersByTime(10); // drive the final tick -> completion
assertSnapshotCompleted(engine.getSnapshot());
```

## Coming Soon

Adapters for Angular, Vue, Svelte, and a vanilla bundle are in development. As they land, this page will grow with side-by-side examples so you can port patterns across frameworks with minimal effort.
