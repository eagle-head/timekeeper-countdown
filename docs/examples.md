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

```tsx
import { useState } from 'react';
import { useCountdown } from '@timekeeper-countdown/react';

function AdjustableCountdown() {
  const [seconds, setSeconds] = useState(150);
  const countdown = useCountdown(seconds, { autoStart: false });

  return (
    <section>
      <label>
        Seconds
        <input type="number" value={seconds} onChange={event => setSeconds(Number(event.target.value) || 0)} />
      </label>

      <div>
        <button onClick={countdown.start}>Start</button>
        <button onClick={countdown.pause}>Pause</button>
        <button onClick={() => countdown.reset(seconds)}>Apply</button>
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

## Coming Soon

Adapters for Angular, Vue, Svelte, and a vanilla bundle are in development. As they land, this page will grow with side-by-side examples so you can port patterns across frameworks with minimal effort.
