---
layout: home

hero:
  name: Timekeeper Countdown
  tagline: Countdown timer library for React and beyond
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: API Reference
      link: /api-reference

features:
  - title: React Hook
    details: useCountdown hook with full TypeScript support and automatic lifecycle management.
  - title: Core Engine
    details: Framework-agnostic countdown engine for Node.js, vanilla JS, or any runtime.
  - title: Testing Utilities
    details: Built-in fake clocks and snapshot factories for deterministic timer testing.
---

## What ships today?

- `@timekeeper-countdown/react` – exposes the `useCountdown` hook.
- Shared helpers under `@timekeeper-countdown/core/*` – formatting utilities, fake clocks, and TypeScript types used by the hook.

## What is coming next?

The core engine already powers the React package. Additional adapters are being stabilised so each framework gets a native experience with the same behaviour:

- `@timekeeper-countdown/angular`
- `@timekeeper-countdown/vue`
- `@timekeeper-countdown/svelte`
- Lightweight vanilla bindings for direct DOM use

## Documentation Map

- [Getting Started](getting-started.md) – install the React package, understand snapshots, and render your first timer.
- [Core Usage](core-usage.md) – use the core engine directly in Node.js, vanilla JS, or any framework without a dedicated adapter.
- [API Reference](api-reference.md) – complete reference for `useCountdown`, its options, and the data it returns.
- [Advanced Usage](advanced-usage.md) – custom clocks, coordinating multiple timers, and formatting strategies.
- [Examples](examples.md) – copy-and-paste React snippets for common scenarios.
- [Roadmap & Future Adapters](roadmap.md) – overview of what is planned beyond React.
- [FAQ](faq.md) – answers to common questions.

Looking for the source? Everything lives in the [`packages/`](https://github.com/eagle-head/timekeeper-countdown/tree/main/packages) directory. Contributions are welcome!
