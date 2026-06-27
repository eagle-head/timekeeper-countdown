# FAQ

Common questions about the React release of **Timekeeper Countdown**.

### 1. Which package should I install?

Install `@timekeeper-countdown/react`. It bundles the countdown engine and exposes the `useCountdown` hook. You do not need to install the core package separately.

### 2. Does the library depend on React?

Yes. The published package targets React 17+ and declares `react` (`>=17.0.0`) as its only peer dependency. Future adapters will target their respective frameworks.

### 3. What timer states can I expect?

The state machine cycles through `IDLE`, `RUNNING`, `PAUSED`, and `STOPPED`. When `totalSeconds` reaches `0` and the machine transitions to `STOPPED`, `snapshot.isCompleted` becomes `true`.

### 4. Can I change the remaining time while the timer is running?

Yes. Use `setSeconds(next)` to adjust the time in place, or `reset(nextInitialSeconds)` to update the starting value and transition back to `IDLE`.

### 5. How accurate is the countdown?

The engine samples `performance.now()` (falling back to `Date.now()`) and corrects for tab throttling on each tick. Adjust `tickIntervalMs` if you need denser or sparser updates.

Every time provider — the default one and any custom provider you inject — is wrapped in a finite, non-decreasing guard, so a `NaN`/`Infinity`/backward clock reading (from NTP, DST, or sleep-wake) is repaired to the last good value, and remaining seconds is always clamped to `[0, initialSeconds]`. (A provider that *throws* instead routes to `onError`.)

### 6. How do I format the remaining time?

Import helpers from `@timekeeper-countdown/core/format`, for example `formatTime(snapshot)` or `formatMinutes(snapshot)`. They return zero-padded strings ready for display.

### 7. How do I write deterministic tests?

Use `createFakeTimeProvider` from `@timekeeper-countdown/core/testing-utils` and pass it through the `timeProvider` option via `toTimeProvider()`. You can then advance the fake clock inside your tests. The package also provides `buildSnapshot` and `buildSnapshotSequence` to fabricate snapshots without running an engine, plus `assertSnapshotState`, `assertSnapshotCompleted`, and `assertRemainingSeconds` for declarative assertions. See the [API Reference](api-reference.md#testing-utilities-timekeeper-countdowncoretesting-utils) for full details.

### 8. Will there be official Angular/Vue/Svelte adapters?

Yes. They are on the roadmap and will share the same engine, state machine, and helper modules. Documentation will expand as each adapter ships.

### 9. Can I still access the core engine directly?

The engine ships with the React package but is considered internal while we finalise the multi-framework story. Expect breaking changes if you import it directly—stick to `useCountdown` for now.

### 10. Do I need to call `destroy()` manually?

No. The hook tears down the engine automatically in `useEffect` cleanup. Manual cleanup is only necessary if you instantiate the engine yourself (not recommended for the current release).
