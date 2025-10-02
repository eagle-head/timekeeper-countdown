# Timekeeper Countdown ⏳

**Timekeeper Countdown** is a lightweight countdown engine written in TypeScript. The core package ships with zero runtime dependencies and exposes a predictable finite-state machine that you can control from vanilla JavaScript, Node.js, or any framework. A first-party React hook lives in a separate package so React stays a peer dependency of the consumer, not of the engine.

## Highlights

- Framework-agnostic core with an optional React adapter (`@timekeeper-countdown/react`)
- Deterministic state machine with four states: `IDLE`, `RUNNING`, `PAUSED`, `STOPPED`
- Snapshot-based API that always reflects the remaining time in multiple units
- Built-in formatting helpers (`@timekeeper-countdown/core/format`) for quick UI rendering
- Published bundle weighs ~20 KB minified (core + React adapter) with zero direct deps
- Testing utilities (`@timekeeper-countdown/core/testing`) for fake clocks and snapshot assertions

## Quick Peek

```ts
import { Countdown, TimerState } from '@timekeeper-countdown/core'

const countdown = Countdown(90, {
  onUpdate: (minutes, seconds) => {
    document.querySelector('#display')!.textContent = `${minutes}:${seconds}`
  },
  onStateChange: (state) => {
    if (state === TimerState.STOPPED) {
      console.log('Countdown finished!')
    }
  },
})

countdown.start()
```

Need more control? Use the lower-level `CountdownEngine` to access full snapshots, subscribe to updates, or plug in a custom time provider.

## Packages in This Repo

- `@timekeeper-countdown/core`: countdown engine, formatting helpers, and testing utilities
- `@timekeeper-countdown/react`: `useCountdown` hook built on top of the core engine (declares `react` + `react-dom` as peer dependencies)

Install only what you need:

```bash
npm install @timekeeper-countdown/core
# and optionally
npm install @timekeeper-countdown/react
```

## Documentation Map

- [Getting Started](getting-started.md) – installation, core usage, and basic DOM integration
- [API Reference](api-reference.md) – complete API surface for core, format helpers, and testing utilities
- [Advanced Usage](advanced-usage.md) – custom time providers, snapshots, and formatting patterns
- [Examples](examples.md) – ready-to-run snippets for vanilla and React apps
- [React Integration](react-integration.md) – guide to the `useCountdown` hook
- [Vanilla Integration](vanilla-integration.md) – wiring the engine into plain HTML/JS projects
- [FAQ](faq.md) – answers to common questions and troubleshooting tips

Have ideas or found a bug? [Open an issue](https://github.com/eagle-head/timekeeper-countdown/issues) or submit a PR.
