# React Integration Guide

`@timekeeper-countdown/react` exposes the `useCountdown` hook. This page gathers the most common patterns in one place so you can wire the hook into your components with confidence.

## Installation

```bash
npm install @timekeeper-countdown/react
```

The hook lists `react` and `react-dom` as peer dependencies (React 17+). The shared engine and helper utilities are bundled automatically.

## Basic Hook Usage

```tsx
import { useCountdown } from '@timekeeper-countdown/react';
import { formatTime } from '@timekeeper-countdown/core/format';

export function CountdownCard() {
  const countdown = useCountdown(90, {
    autoStart: false,
  });

  const { minutes, seconds } = formatTime(countdown.snapshot);

  return (
    <article>
      <h2>
        {minutes}:{seconds}
      </h2>
      <p>Status: {countdown.state}</p>
      <button onClick={countdown.start} disabled={countdown.isRunning}>
        Start
      </button>
      <button onClick={countdown.pause} disabled={!countdown.isRunning}>
        Pause
      </button>
      <button onClick={() => countdown.reset(90)}>Reset</button>
    </article>
  );
}
```

## Options Recap

```ts
const result = useCountdown(initialSeconds, {
  autoStart,
  tickIntervalMs,
  timeProvider,
  onSnapshot,
  onStateChange,
  onError,
});
```

- `autoStart?: boolean` – start immediately on mount (default `false`).
- `tickIntervalMs?: number` – polling interval in milliseconds (default `100`).
- `timeProvider?: TimeProvider | (() => number)` – swap the clock source; pass adapters from `@timekeeper-countdown/core/testing-utils` for deterministic control.
- `onSnapshot?: (snapshot) => void` – run side effects on every update.
- `onStateChange?: (state, snapshot) => void` – observe state transitions.
- `onError?: (error) => void` – capture unexpected engine issues.

All options are optional; the defaults cover most scenarios.

## Returned Fields

`useCountdown` returns the current snapshot plus memoised control methods. Every render receives a fresh snapshot, but the control functions remain referentially stable.

```ts
const { snapshot, state, totalSeconds, parts, isRunning, isCompleted, start, pause, resume, reset, stop, setSeconds } =
  useCountdown(300);
```

- `snapshot` includes `initialSeconds`, `totalSeconds`, derived `parts`, and helper flags.
- `parts` breaks down time into numbers (`minutes`, `hours`, etc.).
- `isRunning` / `isCompleted` are convenience booleans.
- `start`/`pause`/`resume`/`reset`/`stop` return `false` when the transition is invalid for the current state.
- `setSeconds` adjusts the remaining time without changing the current state, ideal for "skip" or "extend" buttons.

## Custom Time Providers

```tsx
import { createFakeTimeProvider, toTimeProvider } from '@timekeeper-countdown/core/testing-utils';

const fake = createFakeTimeProvider({ startMs: 0 });

function ControlledCountdown() {
  const countdown = useCountdown(30, {
    autoStart: true,
    timeProvider: toTimeProvider(fake),
    tickIntervalMs: 10,
  });

  return (
    <div>
      <p>{countdown.totalSeconds}s</p>
      <button onClick={() => fake.advance(1000)}>Advance 1 second</button>
    </div>
  );
}
```

Passing a fake provider keeps your tests synchronous and deterministic. You can also use this hook to sync multiple countdowns to a shared clock.

## Multiple Timers

```tsx
import { useEffect } from 'react';
import { useCountdown } from '@timekeeper-countdown/react';

function MultiTimerDashboard() {
  const focus = useCountdown(1500);
  const breakTimer = useCountdown(300);
  const { isCompleted: focusCompleted } = focus;
  const { reset: resetBreak, start: startBreak } = breakTimer;

  useEffect(() => {
    if (focusCompleted) {
      resetBreak();
      startBreak();
    }
  }, [focusCompleted, resetBreak, startBreak]);

  return (
    <div>
      <TimerCard title="Focus" countdown={focus} />
      <TimerCard title="Break" countdown={breakTimer} />
    </div>
  );
}
```

Each hook call is isolated; just pass the result object into child components that know how to render a countdown.

## Cleanup

No extra cleanup is required. The hook destroys the underlying engine when the component unmounts. If you ever instantiate the engine manually (not recommended for this release), call `destroy()` yourself.

## Looking Ahead

Adapters for Angular, Vue, Svelte, and vanilla JavaScript are in development. They will expose the same state machine, snapshot shape, and helper utilities described here, so anything you learn while building React components will transfer smoothly.
