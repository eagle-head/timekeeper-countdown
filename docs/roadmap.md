# Roadmap & Future Adapters

Today the public API centres on the React hook. The shared countdown engine already powers it, and we are preparing official adapters so the same experience lands in other ecosystems.

## Planned Packages

| Package                         | Status         | Notes                                                                     |
| ------------------------------- | -------------- | ------------------------------------------------------------------------- |
| `@timekeeper-countdown/angular` | In research    | Native Angular service + directives that mirror the React hook semantics. |
| `@timekeeper-countdown/vue`     | In development | Vue composable with the same snapshot contract.                           |
| `@timekeeper-countdown/svelte`  | Planned        | Svelte store wrapper exposing the familiar state machine.                 |
| `@timekeeper-countdown/vanilla` | Planned        | Lightweight helper for direct DOM usage without a framework.              |

As each adapter stabilizes we will publish:

- Installation guides tailored to the framework.
- Example components that mirror the React snippets in this documentation.
- Notes about interoperability (mixing multiple adapters in the same project, sharing fake time providers, etc.).

## What stays consistent

Regardless of framework, the following behavior is guaranteed:

- Four timer states: `IDLE`, `RUNNING`, `PAUSED`, `STOPPED`.
- Snapshot objects with `totalSeconds`, derived `parts`, and boolean helpers.
- Formatting utilities under `@timekeeper-countdown/core/format`.
- Testing tools under `@timekeeper-countdown/core/testing-utils`.

If you have specific framework needs or would like to help shape these adapters, please open an issue. Early feedback ensures the shared engine evolves in the right direction before we lock the APIs.
