# Getting Started

Welcome to **Timekeeper Countdown**! Today the library ships as a React hook. The same engine will back future adapters, so learning the React API teaches the core concepts that Angular, Vue, and vanilla bindings will also follow.

## Install

```bash
npm install @timekeeper-countdown/react
```

The React package bundles the countdown engine and helper utilities. No extra dependencies are required besides your existing React stack (React 17+).

## Create Your First Timer

```tsx
import { useCountdown } from '@timekeeper-countdown/react';
import { formatTime } from '@timekeeper-countdown/core/format';

export function CountdownCard() {
  const countdown = useCountdown(90, {
    autoStart: true,
  });

  const clock = formatTime(countdown.snapshot);

  return (
    <article>
      <h2>
        {clock.minutes}:{clock.seconds}
      </h2>
      <p>Status: {countdown.state}</p>
      <button onClick={countdown.pause} disabled={!countdown.isRunning}>
        Pause
      </button>
      <button onClick={countdown.resume} disabled={countdown.isRunning}>
        Resume
      </button>
      <button onClick={() => countdown.reset(90)}>Restart</button>
    </article>
  );
}
```

Every call to `useCountdown` creates its own engine instance. When the component unmounts the timer is destroyed automatically.

## Understanding Snapshots

Each render exposes a `snapshot` object with all timing information:

```ts
countdown.snapshot.totalSeconds; // remaining seconds (number)
countdown.snapshot.parts.minutes; // derived minutes (number)
countdown.snapshot.state; // "IDLE" | "RUNNING" | "PAUSED" | "STOPPED"
countdown.snapshot.isRunning; // boolean helper
countdown.snapshot.isCompleted; // boolean helper
```

The hook also surfaces `totalSeconds`, `parts`, `isRunning`, and `isCompleted` directly for convenience.

## Controlling the Timer

The hook returns safe state transitions. Each method returns `false` if the transition is invalid (for example calling `pause` while already paused).

```ts
countdown.start(); // start from IDLE
countdown.pause(); // pause from RUNNING
countdown.resume(); // resume from PAUSED
countdown.reset(60); // update the initial seconds (optional argument)
countdown.stop(); // force STOPPED and set remaining time to zero
countdown.setSeconds(15); // adjust remaining time without changing state
```

Because these methods are memoised, you can pass them directly to React event handlers without extra wrapping.

## Next Steps

- Dive into the [API Reference](api-reference.md) for a complete description of options and return types.
- Learn about [advanced usage patterns](advanced-usage.md) such as custom time providers or coordinating multiple timers.
- Check the [examples](examples.md) for ready-to-run snippets.
- Curious about other frameworks? See the [adapter roadmap](roadmap.md).

Questions or ideas? Open an issue on GitHub—we are actively iterating as new adapters come online.
