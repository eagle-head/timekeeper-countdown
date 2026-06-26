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
});
