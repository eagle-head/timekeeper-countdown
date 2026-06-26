import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CountdownEngine } from '../api/countdown-engine';

// Hostile clock readings the engine must survive without corruption.
// These reproduce bugs #1 (NaN zombie), #2 (backward clock counts up), #4 (Infinity instant-complete).
describe('clock robustness — hostile timeProvider', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('bug #1: a timeProvider returning NaN never leaks NaN and never runs away', () => {
    const ticks: number[] = [];
    const engine = CountdownEngine(60, {
      timeProvider: () => NaN,
      tickIntervalMs: 100,
      onSnapshot: s => ticks.push(s.totalSeconds),
    });
    engine.start();
    vi.advanceTimersByTime(2000);
    const snap = engine.getSnapshot();
    expect(Number.isFinite(snap.totalSeconds)).toBe(true);
    expect(ticks.every(Number.isFinite)).toBe(true);
  });

  it('bug #2: a backward clock never makes remaining exceed the initial value', () => {
    let t = 0;
    const engine = CountdownEngine(60, { timeProvider: () => t, tickIntervalMs: 100 });
    engine.start();
    t = 5000;
    vi.advanceTimersByTime(100);
    expect(engine.getSnapshot().totalSeconds).toBe(55);
    t = -100000; // NTP / DST / sleep-wake: clock jumps far backward
    vi.advanceTimersByTime(100);
    const after = engine.getSnapshot().totalSeconds;
    expect(after).toBeLessThanOrEqual(60);
    expect(after).toBe(55); // backward reading ignored; holds at last good
  });

  it('bug #2b: remaining is monotonically non-increasing under an erratic clock', () => {
    const readings = [0, 1000, 900, 2000, 1500, 3000, 2999, 7000];
    let i = 0;
    const engine = CountdownEngine(30, {
      timeProvider: () => readings[Math.min(i, readings.length - 1)],
      tickIntervalMs: 100,
    });
    engine.start();
    let prev = engine.getSnapshot().totalSeconds;
    for (i = 1; i < readings.length; i++) {
      vi.advanceTimersByTime(100);
      const now = engine.getSnapshot().totalSeconds;
      expect(now).toBeLessThanOrEqual(prev);
      expect(now).toBeGreaterThanOrEqual(0);
      prev = now;
    }
  });

  it('bug #4: a single Infinity reading does not cause spurious instant completion', () => {
    let first = true;
    const engine = CountdownEngine(10, {
      timeProvider: () => {
        if (first) {
          first = false;
          return 0;
        }
        return Infinity;
      },
      tickIntervalMs: 100,
    });
    engine.start();
    vi.advanceTimersByTime(100);
    const snap = engine.getSnapshot();
    expect(snap.isCompleted).toBe(false);
    expect(Number.isFinite(snap.totalSeconds)).toBe(true);
    expect(snap.totalSeconds).toBe(10);
  });

  it('a well-behaved monotonic clock still counts down and completes normally', () => {
    let t = 0;
    const onComplete = vi.fn();
    const engine = CountdownEngine(3, {
      timeProvider: () => t,
      tickIntervalMs: 100,
      onStateChange: st => st === 'STOPPED' && onComplete(),
    });
    engine.start();
    for (let s = 1; s <= 3; s++) {
      t = s * 1000;
      vi.advanceTimersByTime(100);
    }
    const snap = engine.getSnapshot();
    expect(snap.totalSeconds).toBe(0);
    expect(snap.isCompleted).toBe(true);
  });
});
