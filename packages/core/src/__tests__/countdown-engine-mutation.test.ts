import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CountdownEngine, buildSnapshot } from '../api/countdown-engine';
import { TimerState } from '../state/state-machine';

// Mutation-targeted oracle gaps for src/api/countdown-engine.ts.
// Each test pins an OBSERVABLE input -> output / state difference that the
// corresponding surviving mutant would change. Time-dependent cases use
// vi.useFakeTimers() + a controllable timeProvider, mirroring the existing
// countdown-engine / clock-robustness tests.
describe('countdown-engine — mutation oracle', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('sanitizeInitialSeconds validation (lines 42, 50)', () => {
    // id 4 / id 6 — forcing the line-42 guard false would let a non-integer through.
    it('throws on a non-integer constructor input', () => {
      expect(() => CountdownEngine(10.5, { timeProvider: () => 0 })).toThrow('finite, non-negative integer');
    });

    it('throws on NaN constructor input', () => {
      expect(() => CountdownEngine(NaN, { timeProvider: () => 0 })).toThrow('finite, non-negative integer');
    });

    // id 21 — boundary: `> MAX_SAFE_INTEGER` must NOT throw at exactly MAX_SAFE_INTEGER.
    // The `>=` mutant would throw here.
    it('accepts exactly Number.MAX_SAFE_INTEGER without throwing', () => {
      expect(() => CountdownEngine(Number.MAX_SAFE_INTEGER, { timeProvider: () => 0 })).not.toThrow();

      const e = CountdownEngine(Number.MAX_SAFE_INTEGER, { timeProvider: () => 0 });
      expect(e.getSnapshot().totalSeconds).toBe(Number.MAX_SAFE_INTEGER);
      expect(e.getSnapshot().initialSeconds).toBe(Number.MAX_SAFE_INTEGER);
      e.destroy();
    });
  });

  describe('buildSnapshot derived flags (lines 88, 89)', () => {
    // id 46 / id 47 / id 48 — isRunning === (state === RUNNING)
    it('isRunning is true only in the RUNNING state', () => {
      expect(buildSnapshot(10, 5, TimerState.RUNNING).isRunning).toBe(true);
      expect(buildSnapshot(10, 5, TimerState.IDLE).isRunning).toBe(false);
      expect(buildSnapshot(10, 5, TimerState.PAUSED).isRunning).toBe(false);
      expect(buildSnapshot(10, 0, TimerState.STOPPED).isRunning).toBe(false);
    });

    // id 51 / id 52 / id 54 — isCompleted === (totalSeconds === 0 && state === STOPPED)
    it('isCompleted requires BOTH zero remaining AND the STOPPED state', () => {
      // Positive case (both operands true).
      expect(buildSnapshot(10, 0, TimerState.STOPPED).isCompleted).toBe(true);
      // Zero remaining but not stopped -> false (kills the `state===STOPPED -> true`
      // and the `&& -> ||` mutants).
      expect(buildSnapshot(10, 0, TimerState.IDLE).isCompleted).toBe(false);
      expect(buildSnapshot(10, 0, TimerState.RUNNING).isCompleted).toBe(false);
      // Stopped but remaining !== 0 -> false (kills the `totalSeconds===0 -> true`
      // and the `&& -> ||` mutants).
      expect(buildSnapshot(10, 5, TimerState.STOPPED).isCompleted).toBe(false);
    });
  });

  describe('start() guards (lines 171, 176)', () => {
    // id 79 / id 80 — the !canStart() early-return must block a start() from PAUSED.
    it('start() is a no-op (returns false) when already paused', () => {
      let t = 0;
      const e = CountdownEngine(60, { timeProvider: () => t, tickIntervalMs: 100 });

      expect(e.start()).toBe(true);
      t = 2000;
      vi.advanceTimersByTime(100);
      expect(e.getSnapshot().totalSeconds).toBe(58);

      expect(e.pause()).toBe(true);
      expect(e.getSnapshot().state).toBe(TimerState.PAUSED);

      // Without the canStart() guard the timer would silently resume and return true.
      expect(e.start()).toBe(false);
      expect(e.getSnapshot().state).toBe(TimerState.PAUSED);

      e.destroy();
    });

    // id 82 — `if (started)` must NOT run the RUNNING transition when timer.start()
    // returns false (e.g. starting a zero-length countdown).
    it('start() on a zero-second countdown does not enter the RUNNING state', () => {
      const e = CountdownEngine(0, { timeProvider: () => 0 });

      expect(e.start()).toBe(false);
      expect(e.getSnapshot().state).toBe(TimerState.IDLE);
      expect(e.getSnapshot().isRunning).toBe(false);

      e.destroy();
    });
  });

  describe('resume() guard (line 204)', () => {
    // id 100 — `if (resumed)` must NOT run the RESUME transition when timer.start()
    // fails because remaining is zero.
    it('resume() does not enter RUNNING when nothing remains to resume', () => {
      let t = 0;
      const e = CountdownEngine(60, { timeProvider: () => t, tickIntervalMs: 100 });

      expect(e.start()).toBe(true);
      t = 2000;
      vi.advanceTimersByTime(100);
      expect(e.pause()).toBe(true);

      e.setSeconds(0);
      expect(e.getSnapshot().totalSeconds).toBe(0);
      expect(e.getSnapshot().state).toBe(TimerState.PAUSED);

      // timer.start() returns false (0 remaining) -> stay PAUSED.
      expect(e.resume()).toBe(false);
      expect(e.getSnapshot().state).toBe(TimerState.PAUSED);

      e.destroy();
    });
  });

  describe('stop() guard (line 215)', () => {
    // id 104 — `if (transitioned)` must NOT zero the snapshot when stateMachine.stop()
    // is rejected (stop from IDLE is invalid).
    it('stop() from IDLE leaves the snapshot untouched', () => {
      const e = CountdownEngine(60, { timeProvider: () => 0 });

      expect(e.stop()).toBe(false);
      expect(e.getSnapshot().totalSeconds).toBe(60);
      expect(e.getSnapshot().state).toBe(TimerState.IDLE);

      e.destroy();
    });

    // id 104 (ConditionalExpression -> true on `if (transitioned)`): forcing the guard
    // true would run `timer.setSeconds(0)` even on a REJECTED stop() from IDLE, zeroing
    // the timer's live remaining. That corruption is invisible in the (still-60) snapshot
    // but poisons the very next start(): timer.start() early-returns false when remaining
    // is <= 0, so the engine would silently refuse to start. Drive stop()->start() from
    // IDLE and assert the countdown genuinely begins running.
    it('a rejected stop() from IDLE does not poison a subsequent start()', () => {
      let t = 0;
      const e = CountdownEngine(60, { timeProvider: () => t, tickIntervalMs: 100 });

      expect(e.stop()).toBe(false); // rejected: still IDLE
      expect(e.getSnapshot().state).toBe(TimerState.IDLE);

      // With the mutant, the rejected stop() has already set the timer to 0, so this
      // start() returns false and the engine stays IDLE.
      expect(e.start()).toBe(true);
      expect(e.getSnapshot().state).toBe(TimerState.RUNNING);

      // And the countdown actually advances (the timer still holds its 60s).
      t = 1000;
      vi.advanceTimersByTime(100);
      expect(e.getSnapshot().totalSeconds).toBe(59);

      e.destroy();
    });
  });

  describe('reset() single-emission (line 242)', () => {
    // id 116 (ConditionalExpression -> true on `if (!transitioned)`): forcing this true
    // makes reset() ALWAYS call handleSnapshotUpdate — even when stateMachine.reset()
    // already drove a real transition (RUNNING/PAUSED/STOPPED -> IDLE) whose
    // signalStateChange emitted the IDLE snapshot. That produces a DOUBLE emission for a
    // single reset(). The content of both emits is identical, so only the emission COUNT
    // exposes the mutant. Subscribe, then assert exactly one IDLE snapshot per reset().
    it('reset() from RUNNING emits the IDLE snapshot exactly once', () => {
      const t = 0;
      const e = CountdownEngine(60, { timeProvider: () => t, tickIntervalMs: 100 });

      expect(e.start()).toBe(true);

      const seen: TimerState[] = [];
      const sub = e.subscribe(snapshot => seen.push(snapshot.state));
      expect(seen).toEqual([TimerState.RUNNING]); // initial emit on subscribe
      seen.length = 0;

      expect(e.reset()).toBe(true);
      // Real: one IDLE emit via signalStateChange. Mutant: a second, redundant IDLE emit
      // via the always-run handleSnapshotUpdate.
      expect(seen).toEqual([TimerState.IDLE]);
      expect(e.getSnapshot().state).toBe(TimerState.IDLE);
      expect(e.getSnapshot().totalSeconds).toBe(60);

      sub.unsubscribe();
      e.destroy();
    });
  });

  describe('subscribe()/unsubscribe()/destroy() (lines 252, 259, 265)', () => {
    // id 120 — subscribe() must emit the current snapshot to the new listener.
    it('subscribe() immediately emits the current snapshot', () => {
      const e = CountdownEngine(42, { timeProvider: () => 0 });

      let received: ReturnType<typeof e.getSnapshot> | undefined;
      e.subscribe(snapshot => {
        received = snapshot;
      });

      expect(received).toBeDefined();
      expect(received).toEqual(e.getSnapshot());
      expect(received?.totalSeconds).toBe(42);

      e.destroy();
    });

    // id 122 — unsubscribe() must actually remove the listener.
    it('unsubscribe() stops further notifications', () => {
      const e = CountdownEngine(42, { timeProvider: () => 0 });

      const seen: number[] = [];
      const sub = e.subscribe(snapshot => seen.push(snapshot.totalSeconds));
      expect(seen).toEqual([42]); // initial emit

      sub.unsubscribe();
      e.setSeconds(10); // would notify if still subscribed

      expect(seen).toEqual([42]);
      expect(e.getSnapshot().totalSeconds).toBe(10);

      e.destroy();
    });

    // id 123 — destroy() must reset the snapshot to a stopped/zero state.
    it('destroy() resets the snapshot to a stopped, zeroed state', () => {
      const e = CountdownEngine(60, { timeProvider: () => 0 });

      e.destroy();
      const snap = e.getSnapshot();
      expect(snap.totalSeconds).toBe(0);
      expect(snap.state).toBe(TimerState.STOPPED);
    });
  });

  // ── EQUIVALENT survivors (documented, intentionally not tested) ────────────────
  // The mutants below survive because no public-API input can make the mutated code
  // observably diverge from the real code. They are honest equivalent mutants, not
  // oracle gaps, so per policy they are documented here rather than "killed" with a
  // theater test. Each note states the location, the mutation, and the one-line
  // unobservability argument.
  //
  // sanitizeInitialSeconds guard (line 35):
  //   `if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value))`
  //   The trailing `!Number.isInteger(value)` already fully decides the throw:
  //   Number.isInteger is true ONLY for finite integer numbers, and it never coerces,
  //   so for any value where it is true the first two operands are necessarily false,
  //   and for any value the first two would reject (non-number / non-finite) it is true.
  //   • id 6  — Conditional -> false on `typeof value !== 'number'`: drops the redundant
  //     typeof operand; every non-number also fails `!Number.isFinite` (no coercion), so
  //     the throw set is unchanged. EQUIVALENT.
  //   • id 4  — Conditional -> false on `typeof … || !Number.isFinite(value)`: leaves
  //     `!Number.isInteger(value)`, which is true for exactly the same inputs the full
  //     guard threw on. EQUIVALENT.
  //   • id 5  — LogicalOperator `||` -> `&&` between the first two operands: makes the
  //     condition `(A && B) || C`. It differs from `A || B || C` only when C
  //     (`!Number.isInteger`) is false, i.e. an integer number — but then A (`typeof≠number`)
  //     and B (`!isFinite`) are both false, so `A&&B` and `A||B` are both false. EQUIVALENT.
  //
  // Optional callback invocations (lines 106, 131, 146):
  //   `options.onSnapshot?.(…)`, `options.onStateChange?.(…)`, `options.onError?.(…)`
  //   • id 59 / id 67 / id 71 — OptionalChaining removed. Each call is the SOLE statement
  //     inside a `try { } catch {}` whose catch body is empty. Dropping `?.` changes
  //     behavior only when the callback is null/undefined, where the mutant throws a
  //     TypeError — which is immediately swallowed by the empty catch, with nothing after
  //     it in the try to skip. When the callback is a function both forms call it
  //     identically. No public input observably diverges. EQUIVALENT. (Corroborated: the
  //     existing suite drives ticks/transitions/errors with these callbacks omitted, and
  //     all three mutants still survived.)
  //
  // pause() guard (line 194): `if (!stateMachine.canPause()) return false;`
  //   • id 91 (Conditional -> false) / id 92 (BlockStatement -> {}) — both delete the early
  //     `return false`, letting pause() fall through to `timer.stop(); return
  //     stateMachine.pause()`. canPause() is false only in IDLE/PAUSED/STOPPED; the engine
  //     invariant "timer runs ⟺ state === RUNNING" makes timer.stop() a no-op in those
  //     states, and stateMachine.pause() rejects the invalid transition (returns false,
  //     emits no snapshot). So pause() still returns false with no state change — identical
  //     to the guarded path. EQUIVALENT.
  //
  // stop() bookkeeping (line 218): `if (transitioned) { timer.setSeconds(0); }`
  //   • id 105 (Conditional -> false) / id 106 (BlockStatement -> {}) — both skip
  //     `timer.setSeconds(0)` after a SUCCESSFUL stop(). But a successful stop already
  //     emitted a STOPPED snapshot reporting 0 via signalStateChange, so getSnapshot() is 0
  //     regardless. Skipping the call only leaves the timer's internal remaining stale, and
  //     from STOPPED every path that could surface it (reset / setSeconds / destroy)
  //     overwrites the timer before reading it. Never observable. EQUIVALENT. (Contrast
  //     id 104 above — Conditional -> true — which IS killable: it runs setSeconds(0) on a
  //     REJECTED stop from IDLE, poisoning the next start().)
});
