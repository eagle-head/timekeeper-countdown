# Advanced Usage

Dig deeper into **Timekeeper Countdown** by composing the lower-level engine, custom time providers, and formatting helpers.

## Manual Engine Control

`CountdownEngine` gives you complete control over state transitions and subscriptions.

```ts
import { CountdownEngine, TimerState } from '@timekeeper-countdown/core'

const engine = CountdownEngine(600, {
  onSnapshot: (snapshot) => console.log('seconds left:', snapshot.totalSeconds),
  onStateChange: (state, snapshot) => {
    if (state === TimerState.STOPPED && snapshot.isCompleted) {
      console.log('Done!')
    }
  },
})

engine.start()
```

Use `engine.subscribe(listener)` to attach multiple observers. Each `listener` receives the latest snapshot immediately and whenever the state updates:

```ts
const subscription = engine.subscribe((snapshot) => {
  renderProgress(snapshot.totalSeconds)
})

// Later
subscription.unsubscribe()
```

## Injecting a Custom Time Provider

By default the engine polls every 100 ms using `performance.now()` (falling back to `Date.now()`). Provide your own clock for deterministic tests or to hook into an external scheduler.

```ts
import { CountdownEngine } from '@timekeeper-countdown/core'
import { createFakeTimeProvider, toTimeProvider } from '@timekeeper-countdown/core/testing'

const fake = createFakeTimeProvider({ startMs: 0, tickMs: 1000 })

const engine = CountdownEngine(5, {
  timeProvider: toTimeProvider(fake),
  tickIntervalMs: 10,
})

engine.start()

fake.advance(5000) // jump 5 seconds ahead
console.log(engine.getSnapshot().totalSeconds) // 0
```

You can also pass a plain function that returns milliseconds:

```ts
const engine = CountdownEngine(120, {
  timeProvider: () => window.myClock.now(),
})
```

## Handling Errors

If the internal timer throws, the engine stops, transitions to `STOPPED`, and forwards the error to `onError` (when provided). Keep your handler defensive and consider a retry strategy:

```ts
const engine = CountdownEngine(30, {
  onError: (error) => {
    console.error('Timer failure', error)
    // Decide whether to resume or notify the user
  },
})
```

## Formatting Strategies

The `@timekeeper-countdown/core/format` entry point offers tiny helpers that avoid repeating `Math.floor` and `padStart` logic.

```ts
import { formatTime, formatHours, formatDays } from '@timekeeper-countdown/core/format'

function render(snapshot) {
  const clock = formatTime(snapshot)
  const hours = formatHours(snapshot)
  const days = formatDays(snapshot.totalSeconds)

  return `${days}d ${hours}h ${clock.minutes}:${clock.seconds}`
}
```

If you need isolated memoization (for example, in React `useMemo` hooks), instantiate a formatter:

```ts
import { Formatter } from '@timekeeper-countdown/core/format'

const formatter = Formatter()
const { minutes, seconds } = formatter.formatTime(snapshot)
```

## Coordinating Multiple Timers

Because the engine exposes `setSeconds` and `reset`, you can orchestrate multi-stage flows.

```ts
const work = CountdownEngine(25 * 60)
const breakTime = CountdownEngine(5 * 60)

work.subscribe((snapshot) => {
  if (snapshot.isCompleted) {
    breakTime.reset()
    breakTime.start()
  }
})

work.start()
```

Remember to call `destroy()` on each engine when the surrounding component unmounts or when you no longer need the timer.

## Snapshot Utilities for Tests

The `@timekeeper-countdown/core/testing` helpers let you fabricate snapshots or assert state without spinning real timers:

```ts
import {
  buildSnapshot,
  assertSnapshotState,
  TimerState,
} from '@timekeeper-countdown/core/testing'

const snapshot = buildSnapshot({ totalSeconds: 42, state: TimerState.RUNNING })
assertSnapshotState(snapshot, TimerState.RUNNING)
```

Combine these utilities with a fake time provider to unit test UI layers deterministically.
