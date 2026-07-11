import { describe, it, expect, vi, afterEach } from 'vitest';
import { createSafeTimeProvider, createMonotonicTimeSource } from '../runtime/time-providers';

/**
 * Mutation-killing tests for src/runtime/time-providers.ts.
 *
 * These assert observable behavior through the public factory functions
 * `createSafeTimeProvider` and `createMonotonicTimeSource`. Titles describe the
 * mutation each case kills conceptually (boundary, forced-true, guard clause)
 * rather than by volatile line number / Stryker mutant id, which drift every run.
 */

/** Install a stubbed global `performance.now` that yields `vals` in order (last value repeats). */
function stubPerf(...vals: unknown[]): void {
  const fn = vi.fn();
  vals.forEach((v, i) => {
    if (i === vals.length - 1) {
      fn.mockReturnValue(v as number);
    } else {
      fn.mockReturnValueOnce(v as number);
    }
  });
  vi.stubGlobal('performance', { now: fn });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('createSafeTimeProvider - initialization validation', () => {
  it('keeps the performance provider when init reading is exactly 0 (>= boundary)', () => {
    // 0 satisfies testTime >= 0; a `> 0` mutant would reject it and fall back to date.
    stubPerf(0);
    const p = createSafeTimeProvider();
    expect(p.type).toBe('performance');
    expect(p.isHighResolution).toBe(true);
  });

  it('falls back to date when init reading is negative (>= forced true)', () => {
    // -5 fails testTime >= 0, so the real code throws and falls back.
    // A mutant forcing the condition true would wrongly keep performance.
    stubPerf(-5);
    const p = createSafeTimeProvider();
    expect(p.type).toBe('date');
    expect(p.isHighResolution).toBe(false);
  });

  it('keeps the performance provider when init reading equals MAX_SAFE_INTEGER (<= boundary)', () => {
    // MAX satisfies testTime <= MAX; a `< MAX` mutant would reject it.
    stubPerf(Number.MAX_SAFE_INTEGER);
    const p = createSafeTimeProvider();
    expect(p.type).toBe('performance');
    expect(p.isHighResolution).toBe(true);
  });

  it('falls back to date when init reading exceeds MAX_SAFE_INTEGER (<= forced true)', () => {
    // MAX+1 is finite but fails testTime <= MAX, so real code falls back.
    stubPerf(Number.MAX_SAFE_INTEGER + 1);
    const p = createSafeTimeProvider();
    expect(p.type).toBe('date');
    expect(p.isHighResolution).toBe(false);
  });
});

describe('createSafeTimeProvider - now() validation + fallback switch', () => {
  // Each test inits with a valid performance reading (so the provider starts as
  // 'performance'), then returns a bad value from now(). The real code throws,
  // permanently switches to the date fallback, and returns a valid time.
  // Any mutant that wrongly accepts the bad value keeps the 'performance' provider
  // and returns the bad value itself.
  function expectFallbackOnBadNow(bad: unknown): void {
    stubPerf(1000, bad);
    const p = createSafeTimeProvider();
    expect(p.type).toBe('performance'); // chosen at init
    const result = p.now();
    expect(p.type).toBe('date'); // switched after the bad reading
    expect(p.isHighResolution).toBe(false);
    expect(typeof result).toBe('number');
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeGreaterThanOrEqual(0);
  }

  it('rejects NaN and falls back (whole-condition guard)', () => {
    expectFallbackOnBadNow(NaN);
  });

  it('rejects a negative reading and falls back (>= 0 guard)', () => {
    expectFallbackOnBadNow(-5);
  });

  it('rejects a numeric string and falls back (non-number guard)', () => {
    expectFallbackOnBadNow('5');
  });

  it('rejects Infinity and falls back (isFinite guard)', () => {
    expectFallbackOnBadNow(Infinity);
  });

  it('rejects a reading above MAX_SAFE_INTEGER and falls back', () => {
    expectFallbackOnBadNow(Number.MAX_SAFE_INTEGER + 1);
  });
});

describe('createSafeTimeProvider - fallback (Date.now) validation', () => {
  it('returns 0 when the Date fallback yields Infinity', () => {
    // performance unavailable -> provider is the date fallback from the start.
    vi.stubGlobal('performance', undefined);
    vi.spyOn(Date, 'now').mockReturnValue(Infinity);
    const p = createSafeTimeProvider();
    expect(p.type).toBe('date');
    // Infinity fails the fallback validation (isFinite / typeof / <= checks),
    // so the safe last-resort 0 is returned. Mutants that accept it return Infinity.
    expect(p.now()).toBe(0);
  });

  it('returns 0 when the Date fallback yields a negative value', () => {
    vi.stubGlobal('performance', undefined);
    vi.spyOn(Date, 'now').mockReturnValue(-5);
    const p = createSafeTimeProvider();
    expect(p.now()).toBe(0);
  });

  it('returns 0 when the Date fallback exceeds MAX_SAFE_INTEGER (shared upper-bound guard)', () => {
    // A finite Date reading above the safe-integer ceiling must be rejected on the fallback
    // path too, exactly as the primary now() path rejects it. Guards the unified isValidTime
    // upper bound: a `< MAX` -> `<= MAX` or dropped-bound mutant would return the oversized value.
    vi.stubGlobal('performance', undefined);
    vi.spyOn(Date, 'now').mockReturnValue(Number.MAX_SAFE_INTEGER + 1);
    const p = createSafeTimeProvider();
    expect(p.type).toBe('date');
    expect(p.now()).toBe(0);
  });
});

/**
 * ── EQUIVALENT surviving mutants in createMonotonicTimeSource (documented, deliberately NOT tested) ──
 * These three Stryker survivors are observationally identical to the original for every numeric time
 * reading; the ONLY input that distinguishes each is a negative-zero SIGN, visible solely via
 * Object.is / (1/x), which is outside the time-value contract — all downstream elapsed math and
 * monotonicity treat -0 === 0 (`-0 < x` ≡ `0 < x`, and `x - (-0) === x - 0`). Production, moreover,
 * only ever calls createMonotonicTimeSource(source) with the default startValue = 0
 * (see countdown-engine.ts), so none of these boundaries is reachable with a distinguishing value.
 *
 *   • L116 EqualityOperator  `startValue >= 0` -> `startValue > 0`
 *     Differs only at startValue === 0: `0 >= 0` keeps startValue (= 0); `0 > 0` falls to the `: 0`
 *     default (also 0). Both set last = 0 — same first reading. (At -0 the real code keeps last = -0
 *     vs the mutant's 0; Object.is-only, never observed by time arithmetic.)
 *   • L120 first operand ConditionalExpression -> false  (`typeof next !== 'number'` -> `false`)
 *     A redundant defensive clause: Number.isFinite(x) is false for EVERY non-number (it never
 *     coerces), so the next operand `!Number.isFinite(next)` already covers every non-number the
 *     typeof clause caught. Whenever the dropped operand was true, the following operand is also
 *     true, so the same early-return branch is taken.
 *   • L120 EqualityOperator  `next < last` -> `next <= last`
 *     Differs only at next === last: the original re-assigns last = next and returns it; the mutant
 *     returns the unchanged last. For finite numbers next === last means equal values, so the
 *     returned number and all subsequent comparisons are identical. (Again -0-vs-0 is the sole
 *     Object.is-only exception.)
 */
describe('createMonotonicTimeSource - startValue sanitization', () => {
  // The init `last` value is exposed by calling the wrapper with a source that
  // returns NaN: the wrapper then returns `last` unchanged.
  const badSource = () => NaN;

  it('keeps a valid non-negative startValue (a forced-to-0 mutant would fail this)', () => {
    const fn = createMonotonicTimeSource(badSource, 5);
    expect(fn()).toBe(5);
  });

  it('resets a NaN startValue to 0 (whole condition forced true)', () => {
    const fn = createMonotonicTimeSource(badSource, NaN);
    expect(fn()).toBe(0);
  });

  it('resets an Infinity startValue to 0 (isFinite guard)', () => {
    const fn = createMonotonicTimeSource(badSource, Infinity);
    expect(fn()).toBe(0);
  });

  it('resets a negative startValue to 0 (>= 0 guard)', () => {
    const fn = createMonotonicTimeSource(badSource, -5);
    expect(fn()).toBe(0);
  });

  it('defaults to 0 when startValue is omitted', () => {
    const fn = createMonotonicTimeSource(badSource);
    expect(fn()).toBe(0);
  });
});

describe('createMonotonicTimeSource - reading validation & monotonicity', () => {
  it('repairs NaN/invalid readings to the last good value', () => {
    // A valid first reading, then NaN. The wrapper must repair NaN to the prior good value.
    const vals: unknown[] = [42, NaN];
    let i = 0;
    const fn = createMonotonicTimeSource(() => vals[i++] as number);
    expect(fn()).toBe(42);
    expect(fn()).toBe(42); // NaN repaired to last
  });

  it('repairs a non-number reading to the last good value', () => {
    const vals: unknown[] = [7, 'oops'];
    let i = 0;
    const fn = createMonotonicTimeSource(() => vals[i++] as number);
    expect(fn()).toBe(7);
    expect(fn()).toBe(7);
  });

  it('clamps backward readings to the last good value (next < last branch)', () => {
    const vals = [10, 20, 15, 30];
    let i = 0;
    const fn = createMonotonicTimeSource(() => vals[i++]);
    expect(fn()).toBe(10);
    expect(fn()).toBe(20);
    expect(fn()).toBe(20); // 15 is backward -> clamped
    expect(fn()).toBe(30);
  });

  it('accepts equal and increasing readings', () => {
    const vals = [5, 5, 8];
    let i = 0;
    const fn = createMonotonicTimeSource(() => vals[i++], 5);
    expect(fn()).toBe(5);
    expect(fn()).toBe(5);
    expect(fn()).toBe(8);
  });
});

describe('createMonotonicTimeSource - a throwing source propagates (documented "not caught" contract)', () => {
  // The wrapper repairs out-of-range *values* (NaN/Infinity/backward) to the last good reading,
  // but a source that *throws* is intentionally NOT caught (see the doc comment on the factory):
  // the exception must propagate so the caller's error handling (Timer's onError) can react.
  // This is the deliberate contrast with createSafeTimeProvider, whose now() swallows and falls back.
  it('re-throws a source exception instead of swallowing it', () => {
    const fn = createMonotonicTimeSource(() => {
      throw new Error('source failure');
    });
    expect(() => fn()).toThrow('source failure');
  });

  it('does not repair a throw to the last good value (the throw path is distinct from value repair)', () => {
    let call = 0;
    const fn = createMonotonicTimeSource(() => {
      call += 1;
      if (call === 1) return 42;
      throw new Error('later failure');
    });
    expect(fn()).toBe(42); // first reading is a valid, good value
    // A throw on a later call is NOT quietly repaired to the retained 42 — it surfaces.
    expect(() => fn()).toThrow('later failure');
  });
});
