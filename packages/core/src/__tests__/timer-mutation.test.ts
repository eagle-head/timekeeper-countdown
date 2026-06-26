import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Timer } from '../runtime/timer';

/**
 * Mutation-killing tests for src/runtime/timer.ts.
 *
 * Each test drives the public Timer interface with a controllable `timeProvider`
 * (passed via config) plus fake timers, and asserts the observable countdown
 * state / callbacks — chosen so the assertion FAILS if the targeted mutant were live.
 */

const makeEvents = () => ({
  onTick: vi.fn(),
  onComplete: vi.fn(),
  onError: vi.fn(),
});

describe('Timer - mutation coverage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // Mutant 389: sanitizeTickInterval `if (...)` condition -> false.
  // For tickIntervalMs = 0 the real code returns the 100ms DEFAULT; the mutant would
  // skip the guard and return max(10, floor(0)) = 10ms. Observe the difference by the
  // timing granularity at which the interval callback first runs.
  it('falls back to the 100ms default interval for an invalid tickIntervalMs (not the 10ms minimum)', () => {
    const events = makeEvents();
    let now = 0;
    const timer = Timer(10, events, { timeProvider: () => now, tickIntervalMs: 0 });

    timer.start();
    now = 5000; // 5 seconds of wall-clock have elapsed

    // With the real 100ms default, no interval callback has fired at 50ms.
    vi.advanceTimersByTime(50);
    expect(events.onTick).not.toHaveBeenCalled();
    expect(timer.getTotalSeconds()).toBe(10);

    // Once we cross 100ms, the callback runs and reflects the elapsed wall-clock time.
    vi.advanceTimersByTime(60); // total 110ms
    expect(timer.getTotalSeconds()).toBe(5);
    expect(events.onTick).toHaveBeenLastCalledWith(5);
  });

  // Mutant 402: constructor finite-number guard `if (...)` -> false.
  // The mutant would no longer throw on NaN.
  it('throws when initialSeconds is NaN', () => {
    expect(() => Timer(NaN, makeEvents())).toThrow('initialSeconds must be a finite number');
  });

  // Mutant 416: `initialSeconds > MAX_SAFE_INTEGER` -> `>=`.
  // The boundary value MAX_SAFE_INTEGER must be accepted (real `>` is false); the mutant
  // `>=` would throw at exactly this value.
  it('accepts exactly Number.MAX_SAFE_INTEGER without throwing', () => {
    const events = makeEvents();
    let timer!: ReturnType<typeof Timer>;

    expect(() => {
      timer = Timer(Number.MAX_SAFE_INTEGER, events);
    }).not.toThrow();

    expect(timer.getInitialValue()).toBe(Number.MAX_SAFE_INTEGER);
    expect(timer.getTotalSeconds()).toBe(Number.MAX_SAFE_INTEGER);
  });

  // Mutant 457: resume condition (whole `if`) -> true.
  // A brand-new timer must take the fresh-start branch (assign startTimestamp). The mutant
  // forces the resume branch, which never assigns startTimestamp, so the tick callback
  // returns early and the timer never counts down.
  it('takes the fresh-start branch for a brand-new timer so it actually counts down', () => {
    const events = makeEvents();
    let now = 0;
    const timer = Timer(10, events, { timeProvider: () => now });

    timer.start();
    now = 3000;
    vi.advanceTimersByTime(3100);

    expect(timer.getTotalSeconds()).toBe(7);
    expect(events.onTick).toHaveBeenLastCalledWith(7);
  });

  // Mutant 456: resume condition `&&` -> `||`.
  // With startTimestamp === null but totalSeconds < initialValue (after a manual setSeconds
  // on a never-started timer), the real `&&` is false -> fresh start (assigns startTimestamp
  // and counts down). The `||` mutant takes the resume branch, leaving startTimestamp null,
  // so the timer never advances and stays at 5.
  it('takes the fresh-start branch when a manually lowered, never-started timer is started', () => {
    const events = makeEvents();
    let now = 0;
    const timer = Timer(10, events, { timeProvider: () => now });

    timer.setSeconds(5); // totalSeconds = 5, startTimestamp = null, initialValue stays 10
    timer.start();
    now = 2000;
    vi.advanceTimersByTime(2100);

    // Fresh start: remaining = min(10, max(0, 10 - 2)) = 8.
    expect(timer.getTotalSeconds()).toBe(8);
  });

  // Mutants 479 (`||` -> `&&`) and 480 (whole `if` -> false) in setSeconds.
  // NaN is `typeof 'number'` but not finite; the real guard returns early and leaves
  // totalSeconds untouched. Both mutants let NaN through, corrupting totalSeconds to NaN.
  it('setSeconds ignores NaN and leaves totalSeconds untouched', () => {
    const events = makeEvents();
    const timer = Timer(10, events);

    timer.setSeconds(NaN as unknown as number);

    expect(timer.getTotalSeconds()).toBe(10);
  });

  // Mutant 492: setInitialValue finite-number guard `if (...)` -> false.
  // The mutant lets NaN through, corrupting initialValue to NaN.
  it('setInitialValue ignores NaN and leaves initialValue untouched', () => {
    const events = makeEvents();
    const timer = Timer(10, events);

    timer.setInitialValue(NaN as unknown as number);

    expect(timer.getInitialValue()).toBe(10);
  });

  // Tick-loop `Number.isFinite(elapsedSeconds) ? ... : initialValue` FALSE branch.
  // The engine wraps every provider in a monotonic, finite source, so a non-finite
  // elapsed is only reachable by driving the raw Timer with a hostile provider. Here
  // the provider returns a finite reading at start() then Infinity on every tick, so
  // elapsedMs (and thus elapsedSeconds) is non-finite: the real code HOLDS the last
  // good value (initialValue) and never leaks NaN/Infinity into totalSeconds/onTick.
  it('holds the last value (never leaks non-finite) when elapsed becomes non-finite', () => {
    const events = makeEvents();
    let now = 0; // finite at start() so startTimestamp is captured cleanly
    const timer = Timer(10, events, { timeProvider: () => now });

    timer.start();
    now = Number.POSITIVE_INFINITY; // hostile clock reading on the next tick
    vi.advanceTimersByTime(100);

    expect(timer.getTotalSeconds()).toBe(10);
    expect(Number.isFinite(timer.getTotalSeconds())).toBe(true);
    // No second-change was reported because remaining held at the initial value.
    expect(events.onTick).not.toHaveBeenCalled();
  });
});
