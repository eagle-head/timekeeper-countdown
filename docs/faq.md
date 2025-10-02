# FAQ

Common questions about **Timekeeper Countdown**.

### 1. What packages do I need?

Install `@timekeeper-countdown/core` for the engine. Add `@timekeeper-countdown/react` only if you want the React hook—React stays a peer dependency of your app, not of the library.

### 2. What states does the timer expose?

The finite-state machine cycles through `IDLE`, `RUNNING`, `PAUSED`, and `STOPPED`. When `totalSeconds` reaches `0` and the machine stops, `snapshot.isCompleted` becomes `true`.

### 3. How do I change the remaining time while the timer is running?

Use `reset(newInitialSeconds)` on the high-level `Countdown` helper or `setSeconds(value)` on `CountdownEngine`. Both methods validate the input and emit fresh snapshots.

### 4. Is there a minimum or maximum duration?

Durations must be finite, non-negative integers within JavaScript’s safe integer range (`0` to `Number.MAX_SAFE_INTEGER`). There is no artificial cap like “99 days”.

### 5. Does the library depend on React or other frameworks?

No. The core package has zero runtime dependencies. The React adapter simply wraps the engine and declares `react`/`react-dom` as peer dependencies.

### 6. How accurate is the countdown?

The engine uses `performance.now()` when available (fallback to `Date.now()`) and polls every 100 ms by default. Each tick recalculates elapsed time based on the clock, so short pauses or tab throttling are corrected automatically.

### 7. Can I use it in Node.js?

Yes. Node.js ≥ 16 is supported out of the box. Pass your own `timeProvider` if you want to sync with server time or a custom scheduler.

### 8. How do I format the remaining time?

Use the helpers from `@timekeeper-countdown/core/format` (`formatTime`, `formatMinutes`, `formatHours`, etc.). They accept either raw seconds or any snapshot-like object.

### 9. How do I test components that rely on the countdown?

Import the utilities from `@timekeeper-countdown/core/testing`. `createFakeTimeProvider` lets you advance time deterministically, and the assertion helpers validate snapshots without real timers.

### 10. Do I need to call `destroy()` manually?

If you instantiate `CountdownEngine` yourself, call `destroy()` when the timer is no longer needed to release intervals and observers. The React hook handles cleanup automatically during `useEffect` teardown.
