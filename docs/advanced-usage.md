# Advanced Usage

Take `useCountdown` beyond the basics. These patterns focus on React today, but the concepts apply to future adapters that will expose similar options.

## Coordinate Multiple Timers

Each hook call owns its own engine instance. Compose them to implement flows such as Pomodoro sessions or chained phases.

```tsx
import { useEffect } from 'react';
import { useCountdown } from '@timekeeper-countdown/react';

export function PomodoroBoard() {
  const focus = useCountdown(25 * 60);
  const breakTimer = useCountdown(5 * 60);
  const { reset: resetBreak, start: startBreak, isRunning: breakRunning } = breakTimer;
  const { isCompleted: focusCompleted } = focus;

  useEffect(() => {
    if (focusCompleted && !breakRunning) {
      resetBreak();
      startBreak();
    }
  }, [focusCompleted, breakRunning, resetBreak, startBreak]);

  return (
    <div>
      <TimerCard title="Focus" countdown={focus} />
      <TimerCard title="Break" countdown={breakTimer} />
    </div>
  );
}
```

Passing the entire result object into child components keeps their renders simple and memo-friendly.

## Inject a Custom Clock

Use a fake or shared time provider to keep multiple timers synchronised or to drive them manually in tests.

```tsx
import { useCountdown } from '@timekeeper-countdown/react';
import { createFakeTimeProvider, toTimeProvider } from '@timekeeper-countdown/core/testing-utils';

const fake = createFakeTimeProvider({ startMs: 0 });

export function DebugTimer() {
  const countdown = useCountdown(30, {
    autoStart: true,
    timeProvider: toTimeProvider(fake),
    tickIntervalMs: 10,
  });

  return (
    <div>
      <strong>{countdown.totalSeconds}s</strong>
      <button onClick={() => fake.advance(1000)}>Advance 1s</button>
    </div>
  );
}
```

Because the hook reads the fake clock on every tick, advancing it updates state without waiting for `setTimeout`.

## Skip Ahead or Extend Sessions

`setSeconds` modifies the remaining time in-place without triggering a state transition. Combine it with user actions such as "skip" buttons.

```tsx
import { useCountdown } from '@timekeeper-countdown/react';

function WebinarCountdown() {
  const countdown = useCountdown(10 * 60);

  return (
    <div>
      <button onClick={() => countdown.setSeconds(30)}>Jump to finale</button>
      <button onClick={() => countdown.reset(15 * 60)}>Extend 15 minutes</button>
    </div>
  );
}
```

`reset` accepts an optional argument for the next initial value, letting you implement presets or dynamic durations.

## Memoise Derived Data

Snapshots are stable per render, so you can memoise formatting or domain-specific calculations.

```tsx
import { useMemo } from 'react';
import { useCountdown } from '@timekeeper-countdown/react';
import { formatTime } from '@timekeeper-countdown/core/format';

function TimerDisplay() {
  const countdown = useCountdown(600);

  const clock = useMemo(() => formatTime(countdown.snapshot), [countdown.snapshot]);

  return (
    <span>
      {clock.minutes}:{clock.seconds}
    </span>
  );
}
```

When future adapters arrive, they will expose the same `CountdownSnapshot` shape, so these memoisation patterns carry over.

## Handle Errors Gracefully

If the underlying engine reports an error, your `onError` callback runs. This rarely triggers, but it is useful for logging or retry flows.

```ts
const countdown = useCountdown(120, {
  onError: error => {
    console.error('Countdown failure', error);
    toast.error('We lost track of time. Please try again.');
  },
});
```

Returning to `IDLE` after an error keeps the timer safe to restart.
