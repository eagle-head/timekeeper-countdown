# Getting Started

Welcome to **Timekeeper Countdown**! This guide walks through installing the packages, creating your first timer, and understanding the basics of the API.

## Introduction

The project is split into a tiny, framework-agnostic core (`@timekeeper-countdown/core`) and an optional React adapter (`@timekeeper-countdown/react`). The engine exposes a predictable state machine and snapshot data so you can render any UI you like.

Core capabilities include:

- Start, pause, resume, reset, and stop controls
- Derived time parts (seconds → minutes/hours/days/weeks/years)
- Deterministic state transitions (`IDLE`, `RUNNING`, `PAUSED`, `STOPPED`)
- Optional formatting helpers that convert seconds or snapshots into padded strings

## Installation

Install only the packages you plan to use.

### Core Engine

```bash
npm install @timekeeper-countdown/core
```

### React Hook (optional)

```bash
npm install @timekeeper-countdown/core @timekeeper-countdown/react
```

> The React adapter lists `react` and `react-dom` as peer dependencies. Your application is responsible for providing them.

No extra build steps are needed—the published bundles are ESM and ship their own `.d.ts` types.

## Basic Usage (Vanilla JavaScript)

The simplest way to get started is with the high-level `Countdown` helper. It wraps the engine, subscribes to state changes, and formats minutes/seconds for you.

```ts
import { Countdown, TimerState } from '@timekeeper-countdown/core'

const countdown = Countdown(300, {
  onUpdate: (minutes, seconds) => {
    document.querySelector('#display')!.textContent = `${minutes}:${seconds}`
  },
  onStateChange: (state) => {
    document.body.dataset.timerState = state
  },
})

document.querySelector('#start')!.addEventListener('click', () => countdown.start())
document.querySelector('#pause')!.addEventListener('click', () => countdown.pause())
document.querySelector('#resume')!.addEventListener('click', () => countdown.resume())
document.querySelector('#reset')!.addEventListener('click', () => countdown.reset())
document.querySelector('#stop')!.addEventListener('click', () => countdown.stop())
```

The returned instance exposes the following safe methods:

- `start()`, `pause()`, `resume()`, `reset(newInitialSeconds?)`, `stop()`, `destroy()`
- `getSnapshot()` → latest `CountdownSnapshot`
- `getCurrentState()` → current `TimerState`
- `getSeconds()`/`getMinutes()`/`getHours()` etc. → zero-padded strings derived from the snapshot

Calling `reset()` with a new value immediately updates the timer without starting it. Use `stop()` to force the countdown to zero and transition to `STOPPED`.

## Accessing Full Snapshots

If you need the raw numbers—or want to manage subscriptions manually—drop down to the `CountdownEngine`:

```ts
import { CountdownEngine } from '@timekeeper-countdown/core'

const engine = CountdownEngine(90, {
  onSnapshot: (snapshot) => {
    console.log(snapshot.totalSeconds, snapshot.parts.minutes)
  },
  onStateChange: (state) => console.log('state changed:', state),
})

engine.start()
```

`CountdownSnapshot` includes `totalSeconds`, the original `initialSeconds`, pre-computed `parts`, boolean helpers (`isRunning`, `isCompleted`), and the current `state`.

## Next Steps

- [API Reference](api-reference.md) for every method, option, and type
- [Vanilla Integration Guide](vanilla-integration.md) for full DOM examples
- [React Integration Guide](react-integration.md) if you are using React components
- [Advanced Usage](advanced-usage.md) to learn about custom time providers, testing utilities, and formatting strategies

When you are ready to ship, run `npm run build --workspaces` from the project root to create fresh `dist/` bundles.
