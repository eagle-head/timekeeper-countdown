# Timekeeper Countdown Documentation

Welcome! These docs focus on the React hook (`@timekeeper-countdown/react`) that is available today. The hook ships with the shared countdown engine, so everything you learn here transfers to the upcoming Angular, Vue, Svelte, and vanilla adapters that are currently on the roadmap.

## What ships today?

- `@timekeeper-countdown/react` – exposes the `useCountdown` hook.
- Shared helpers under `@timekeeper-countdown/core/*` – formatting utilities, fake clocks, and TypeScript types used by the hook.

## What is coming next?

The core engine already powers the React package. We are stabilising additional adapters so each framework gets a native experience with the same behaviour:

- `@timekeeper-countdown/angular`
- `@timekeeper-countdown/vue`
- `@timekeeper-countdown/svelte`
- Lightweight vanilla bindings for direct DOM use

As these adapters land, guides for them will appear alongside the React content without breaking changes to existing consumers.

## Documentation Map

- [Getting Started](getting-started.md) – install the React package, understand snapshots, and render your first timer.
- [API Reference](api-reference.md) – complete reference for `useCountdown`, its options, and the data it returns.
- [Advanced Usage](advanced-usage.md) – custom clocks, coordinating multiple timers, and formatting strategies.
- [Examples](examples.md) – copy-and-paste React snippets for common scenarios.
- [Roadmap & Future Adapters](roadmap.md) – overview of what is planned beyond React.
- [FAQ](faq.md) – answers to common questions.

Looking for the source? Everything lives in the [`packages/`](../packages) directory. Contributions are welcome!
