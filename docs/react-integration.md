# React Integration Guide

The package `@timekeeper-countdown/react` exposes a single hook, `useCountdown`, that wraps the core engine with idiomatic React state management.

## Installation

```bash
npm install @timekeeper-countdown/core @timekeeper-countdown/react
```

The adapter declares `react` and `react-dom` as peer dependencies (≥ 17). Make sure they exist in your application.

## Basic Hook Usage

```tsx
import { useCountdown } from '@timekeeper-countdown/react'
import { formatTime } from '@timekeeper-countdown/core/format'
import type { CountdownEngineOptions } from '@timekeeper-countdown/core'

type CountdownCardProps = {
  timeProvider?: CountdownEngineOptions['timeProvider']
}

export function CountdownCard({ timeProvider }: CountdownCardProps) {
  const { snapshot, isRunning, start, pause, reset } = useCountdown(90, {
    autoStart: false,
    timeProvider,
  })

  const { minutes, seconds } = formatTime(snapshot)

  return (
    <article>
      <h2>{minutes}:{seconds}</h2>
      <p>Status: {snapshot.state}</p>
      <button onClick={start} disabled={isRunning}>Start</button>
      <button onClick={pause} disabled={!isRunning}>Pause</button>
      <button onClick={() => reset(90)}>
        Reset
      </button>
    </article>
  )
}
```

## API Summary

```ts
const result = useCountdown(initialSeconds, options?)
```

- `initialSeconds` – non-negative integer
- `options.autoStart?: boolean` – start on mount (default `false`)
- `options.tickIntervalMs?: number` – forwarded to the engine
- `options.timeProvider?: TimeProvider | (() => number)` – inject custom clock
- `options.onSnapshot?: (snapshot) => void` – side effects when snapshots change
- `options.onStateChange?: (state, snapshot) => void`
- `options.onError?: (error) => void`

Returned object:

```ts
interface UseCountdownResult {
  snapshot: CountdownSnapshot
  state: TimerState
  totalSeconds: number
  parts: CountdownSnapshot['parts']
  isRunning: boolean
  isCompleted: boolean
  start(): boolean
  pause(): boolean
  resume(): boolean
  reset(nextInitialSeconds?: number): boolean
  stop(): boolean
  setSeconds(value: number): void
}
```

All functions are memoised with `useCallback`. Under the hood the hook creates a `CountdownEngine` instance, updates React state on every snapshot, and cleans up in `useEffect` cleanup.

## Derived Values and Memos

Because the entire `snapshot` is stable per update, you can derive view state with `useMemo` or dedicated hooks:

```tsx
const { snapshot } = useCountdown(3600)
const { minutes, seconds } = useMemo(() => formatTime(snapshot), [snapshot])
```

## Multiple Timers

Each hook call owns its own engine instance, so using it multiple times inside the same component tree is safe.

```tsx
function MultiTimerDashboard() {
  const main = useCountdown(1500)
  const breakTimer = useCountdown(300)

  return (
    <div>
      <TimerCard title="Focus" countdown={main} />
      <TimerCard title="Break" countdown={breakTimer} />
    </div>
  )
}
```

## Custom Time Providers

You can pass a fake or shared time provider to keep timers in sync or to drive them manually in tests.

```tsx
import { createFakeTimeProvider, toTimeProvider } from '@timekeeper-countdown/core/testing'

const fake = createFakeTimeProvider({ startMs: 0 })

function ControlledCountdown() {
  const countdown = useCountdown(30, {
    autoStart: true,
    timeProvider: toTimeProvider(fake),
    tickIntervalMs: 10,
  })

  return (
    <div>
      <p>{countdown.totalSeconds}s</p>
      <button onClick={() => fake.advance(1000)}>Advance 1 second</button>
    </div>
  )
}
```

## Testing

When testing components that consume `useCountdown`, inject a deterministic provider and assert on the rendered snapshot.

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createFakeTimeProvider, toTimeProvider } from '@timekeeper-countdown/core/testing'

it('counts down when the fake clock advances', async () => {
  const fake = createFakeTimeProvider({ startMs: 0 })

  render(<CountdownCard timeProvider={toTimeProvider(fake)} />)

  await userEvent.click(screen.getByRole('button', { name: /start/i }))
  fake.advance(1000)

  expect(screen.getByText(/00:59/)).toBeInTheDocument()
})
```

(The component forwards an optional `timeProvider` prop to the hook so tests can drive the clock manually.)

## Cleanup

The hook destroys the underlying engine automatically when the component unmounts. Callers do not need to handle `destroy()` manually.
