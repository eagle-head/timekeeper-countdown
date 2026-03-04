# @timekeeper-countdown/react

React hook for the Timekeeper Countdown engine. This package provides an idiomatic way to manage countdown timers in React components while keeping the underlying engine framework-agnostic.

- Single hook: `useCountdown(initialSeconds, options?)`.
- Snapshot-first API that keeps your UI in sync with timer state.
- Zero runtime dependencies besides React.
- Works in React 17+ (including React 18 concurrent mode).
- Ships modern ESM output with type definitions.

---

## Installation

```bash
npm install @timekeeper-countdown/react
```

Peer dependencies (must already exist in your application):

- `react` ≥ 17
- `@timekeeper-countdown/core` is installed automatically as a dependency.

---

## Quick Start

```tsx
import { useCountdown } from '@timekeeper-countdown/react';
import { formatTime } from '@timekeeper-countdown/core/format';

export function CountdownCard() {
  const countdown = useCountdown(5 * 60, {
    autoStart: true,
  });

  const clock = formatTime(countdown.snapshot);

  return (
    <section>
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
      <button onClick={() => countdown.reset(5 * 60)}>Restart</button>
    </section>
  );
}
```

Each hook instance owns a dedicated engine. When the component unmounts the engine is destroyed automatically.

---

## Hook Signature

```ts
const result = useCountdown(initialSeconds: number, options?: UseCountdownOptions);
```

### Options

```ts
interface UseCountdownOptions extends Omit<CountdownEngineOptions, 'onSnapshot' | 'onStateChange' | 'onError'> {
  autoStart?: boolean; // Start automatically on mount (default false)
  onSnapshot?: CountdownEngineOptions['onSnapshot'];
  onStateChange?: CountdownEngineOptions['onStateChange'];
  onError?: CountdownEngineOptions['onError'];
}
```

- `tickIntervalMs`: Polling interval. Default `100`.
- `timeProvider`: Function or engine time provider (see core README) for deterministic timing or shared clocks.
- `autoStart`: If `true`, the hook starts immediately after mounting.

### Return Value

```ts
interface UseCountdownResult {
  snapshot: CountdownSnapshot;
  state: TimerState;
  totalSeconds: number;
  parts: CountdownSnapshot['parts'];
  isRunning: boolean;
  isCompleted: boolean;

  start(): boolean;
  pause(): boolean;
  resume(): boolean;
  reset(nextInitialSeconds?: number): boolean;
  stop(): boolean;
  setSeconds(value: number): void;
}
```

- All control methods mirror the engine and return `false` for invalid transitions.
- `snapshot` is stable per render; derive memoised values with `useMemo` if needed.
- `totalSeconds`, `parts`, `isRunning`, and `isCompleted` are re-exposed for convenience.

---

## Formatting Helpers

Import helpers directly from the core package to render zero-padded strings:

```tsx
import { formatTime } from '@timekeeper-countdown/core/format';

const clock = formatTime(countdown.snapshot);
```

`formatTime` returns `{ minutes: string; seconds: string }`. Additional helpers include `formatMinutes`, `formatHours`, `formatDays`, etc.

---

## Integrating with Custom Time Providers

You can plug a fake or shared time provider using the utilities bundled with the core package:

```tsx
import { createFakeTimeProvider, toTimeProvider } from '@timekeeper-countdown/core/testing-utils';

const fake = createFakeTimeProvider({ startMs: 0 });

function InspectableTimer() {
  const countdown = useCountdown(30, {
    autoStart: true,
    timeProvider: toTimeProvider(fake),
    tickIntervalMs: 10,
  });

  return (
    <div>
      <span>{countdown.totalSeconds}s</span>
      <button onClick={() => fake.advance(1000)}>Advance 1s</button>
    </div>
  );
}
```

This decouples the timer from the real clock and enables deterministic testing or synchronized timers.

---

## Testing

`@testing-library/react` and Vitest/RTL work seamlessly with the hook. Inject the fake provider to avoid relying on real timers:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createFakeTimeProvider, toTimeProvider } from '@timekeeper-countdown/core/testing-utils';
import { useCountdown } from '@timekeeper-countdown/react';

function TestComponent() {
  const fake = useMemo(() => createFakeTimeProvider({ startMs: 0 }), []);
  const countdown = useCountdown(5, {
    autoStart: true,
    timeProvider: toTimeProvider(fake),
  });

  return (
    <div>
      <output>{countdown.totalSeconds}</output>
      <button onClick={() => fake.advance(1000)}>Advance</button>
    </div>
  );
}

it('counts down when the fake clock advances', async () => {
  render(<TestComponent />);
  await userEvent.click(screen.getByRole('button', { name: /advance/i }));
  expect(screen.getByText('4')).toBeInTheDocument();
});
```

The hook handles cleanup automatically, so tests do not need to destroy the engine manually.

### Available Testing Utilities

The core package ships several helpers under `@timekeeper-countdown/core/testing-utils`:

- `createFakeTimeProvider(options?)` — controllable clock with `advance()`, `set()`, `reset()`, and `getTime()`.
- `toTimeProvider(fake)` — adapts a fake clock to the `TimeProvider` interface.
- `buildSnapshot(options?)` — fabricates `CountdownSnapshot` objects for unit tests without running an engine.
- `buildSnapshotSequence(options?)` — generates an array of snapshots simulating a countdown progression.
- `assertSnapshotState(snapshot, expected, message?)` — throws if the snapshot is not in the expected `TimerState`.
- `assertSnapshotCompleted(snapshot, message?)` — throws if the countdown is not completed.
- `assertRemainingSeconds(snapshot, expected, tolerance?, message?)` — throws if remaining seconds differ beyond tolerance.
- `TimerState` — re-exported for convenience (`IDLE`, `RUNNING`, `PAUSED`, `STOPPED`).

See the [core README](https://github.com/eagle-head/timekeeper-countdown/tree/main/packages/core#testing-utilities) or [API Reference](https://eagle-head.github.io/timekeeper-countdown/#/api-reference) for full signatures and examples.

---

## Multiple Timers

Each hook call is independent. Compose them to build complex flows:

```tsx
function MultiStageTimer() {
  const focus = useCountdown(25 * 60, { autoStart: true });
  const breakTimer = useCountdown(5 * 60);

  useEffect(() => {
    if (focus.isCompleted) {
      breakTimer.reset();
      breakTimer.start();
    }
  }, [focus.isCompleted, breakTimer]);

  return (
    <div>
      <TimerCard title="Focus" countdown={focus} />
      <TimerCard title="Break" countdown={breakTimer} />
    </div>
  );
}
```

---

## Related Packages

- Engine & utilities: [`@timekeeper-countdown/core`](https://www.npmjs.com/package/@timekeeper-countdown/core)
- Documentation site (guides & roadmap): <https://eagle-head.github.io/timekeeper-countdown/>
- GitHub repository: <https://github.com/eagle-head/timekeeper-countdown>

---

## Contributing

Bug reports and pull requests are welcome. Please read the [repository guidelines](https://github.com/eagle-head/timekeeper-countdown/blob/main/AGENTS.md) and check your work with:

```bash
npm run lint --workspaces
npm run test --workspaces
npm run typecheck --workspaces
```

---

## License

MIT © [Eduardo Kohn](https://www.linkedin.com/in/eduardo-kohn-56817b195/)
