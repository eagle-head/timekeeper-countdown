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

  // Mutant 401: L118 resume guard `totalSeconds < initialValue` -> `true` (ConditionalExpression).
  // The guard's purpose is to RESUME (back-date elapsed via pausedDuration) ONLY when the current
  // seconds were counted DOWN below the initial value; otherwise start() must be a FRESH start
  // measured from the restart moment. Raise the seconds ABOVE the initial value with setSeconds,
  // capture a non-null startTimestamp with a start()/stop() that never ticks, then restart after
  // wall-clock has advanced. Real code fresh-starts (elapsed measured from now = 3000 -> 9 left);
  // the `true` mutant takes the resume branch, where expectedElapsed = (10 - 20) * 1000 is negative,
  // producing a bogus pausedDuration that back-dates the clock and swallows the first second (holds
  // at 10). (The sibling `-> <=` EqualityOperator mutant is EQUIVALENT — see the NOTE below.)
  it('restart is a fresh start (not a resume) when current seconds exceed the initial value', () => {
    const events = makeEvents();
    let now = 0;
    const timer = Timer(10, events, { timeProvider: () => now });

    timer.setSeconds(20); // totalSeconds = 20 > initialValue (10); startTimestamp reset to null
    timer.start(); // fresh start captures startTimestamp = 0
    timer.stop(); // no tick fired: totalSeconds stays 20, startTimestamp stays non-null

    now = 3000; // wall-clock advances 3s while the timer is stopped
    timer.start(); // real: fresh start (20 is NOT < 10), measuring elapsed from now = 3000

    now = 4000; // 1s after the restart
    vi.advanceTimersByTime(100);

    // Fresh start: remaining = min(10, max(0, 10 - 1)) = 9.
    expect(timer.getTotalSeconds()).toBe(9);
    expect(events.onTick).toHaveBeenLastCalledWith(9);
  });

  /*
   * Equivalent mutants in timer.ts — documented, intentionally left as honest survivors:
   *
   * - L118:38 EqualityOperator `totalSeconds < initialValue` -> `<=` (mutant 402): the two
   *   comparisons differ ONLY when totalSeconds === initialValue with a non-null startTimestamp
   *   (real -> fresh start, mutant -> resume). In that exact state the resume branch computes
   *   expectedElapsed = (initialValue - totalSeconds) * 1000 = 0, so pausedDuration becomes
   *   now - startTimestamp, which makes every future elapsedMs (= T - startTimestamp -
   *   pausedDuration = T - now) identical to the fresh-start branch (startTimestamp = now,
   *   pausedDuration = 0). The invariant `lastReportedSeconds === totalSeconds` holds whenever
   *   startTimestamp !== null, so the first onTick fires at the same threshold too. Observationally
   *   identical -> unkillable. (Note the `-> true` sibling IS killable: it ALSO flips the
   *   totalSeconds > initialValue case, where expectedElapsed goes negative — see the test above.)
   *
   * - L138:9 stop() `if (intervalId)` -> `if (true)` (mutant 414): the branch only differs when
   *   intervalId is null (setInterval never returns a falsy id). Then the mutant runs
   *   clearInterval(null) — a spec no-op — and re-assigns intervalId = null (already null). No
   *   public observable changes (isRunning() stays false) -> unkillable.
   */

  // Mutants 479 (`||` -> `&&`) and 480 (whole `if` -> false) in setSeconds.
  // NaN is `typeof 'number'` but not finite; the real guard returns early and leaves
  // totalSeconds untouched. Both mutants let NaN through, corrupting totalSeconds to NaN.
  // (Equivalent, documented: the first-operand-only mutant `typeof seconds !== 'number'` -> false
  //  is unobservable — `!Number.isFinite(seconds)` already rejects every non-number without
  //  coercion, so the same early return fires; the typeof clause is redundant defense-in-depth.)
  it('setSeconds ignores NaN and leaves totalSeconds untouched', () => {
    const events = makeEvents();
    const timer = Timer(10, events);

    timer.setSeconds(NaN as unknown as number);

    expect(timer.getTotalSeconds()).toBe(10);
  });

  // Mutant 492: setInitialValue finite-number guard `if (...)` -> false.
  // The mutant lets NaN through, corrupting initialValue to NaN.
  // (Equivalent, documented: the first-operand-only mutant `typeof seconds !== 'number'` -> false
  //  is unobservable — `!Number.isFinite(seconds)` subsumes it, so any non-number still returns early.)
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
