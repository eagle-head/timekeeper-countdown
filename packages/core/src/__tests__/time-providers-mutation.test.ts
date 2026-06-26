import { describe, it, expect, vi, afterEach } from 'vitest';
import { createSafeTimeProvider, createMonotonicTimeSource } from '../runtime/time-providers';

/**
 * Mutation-killing tests for src/runtime/time-providers.ts.
 *
 * These assert observable behavior through the public factory functions
 * `createSafeTimeProvider` and `createMonotonicTimeSource`.
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

describe('createSafeTimeProvider - initialization validation (lines 42-43)', () => {
  it('keeps the performance provider when init reading is exactly 0 (>= boundary, mutant 298)', () => {
    // 0 satisfies testTime >= 0; a `> 0` mutant would reject it and fall back to date.
    stubPerf(0);
    const p = createSafeTimeProvider();
    expect(p.type).toBe('performance');
    expect(p.isHighResolution).toBe(true);
  });

  it('falls back to date when init reading is negative (>= forced true, mutant 297)', () => {
    // -5 fails testTime >= 0, so the real code throws and falls back.
    // A mutant forcing the condition true would wrongly keep performance.
    stubPerf(-5);
    const p = createSafeTimeProvider();
    expect(p.type).toBe('date');
    expect(p.isHighResolution).toBe(false);
  });

  it('keeps the performance provider when init reading equals MAX_SAFE_INTEGER (<= boundary, mutant 301)', () => {
    // MAX satisfies testTime <= MAX; a `< MAX` mutant would reject it.
    stubPerf(Number.MAX_SAFE_INTEGER);
    const p = createSafeTimeProvider();
    expect(p.type).toBe('performance');
    expect(p.isHighResolution).toBe(true);
  });

  it('falls back to date when init reading exceeds MAX_SAFE_INTEGER (<= forced true, mutant 300)', () => {
    // MAX+1 is finite but fails testTime <= MAX, so real code falls back.
    stubPerf(Number.MAX_SAFE_INTEGER + 1);
    const p = createSafeTimeProvider();
    expect(p.type).toBe('date');
    expect(p.isHighResolution).toBe(false);
  });
});

describe('createSafeTimeProvider - now() validation + fallback switch (lines 63-77)', () => {
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

  it('rejects NaN and falls back (whole-condition mutants 312/314 etc.)', () => {
    expectFallbackOnBadNow(NaN);
  });

  it('rejects a negative reading and falls back (>= 0 mutants 313/314/322)', () => {
    expectFallbackOnBadNow(-5);
  });

  it('rejects a numeric string and falls back (typeof mutants 315/316/318)', () => {
    expectFallbackOnBadNow('5');
  });

  it('rejects Infinity and falls back (isFinite mutants)', () => {
    expectFallbackOnBadNow(Infinity);
  });

  it('rejects a reading above MAX_SAFE_INTEGER and falls back', () => {
    expectFallbackOnBadNow(Number.MAX_SAFE_INTEGER + 1);
  });
});

describe('createSafeTimeProvider - fallback (Date.now) validation (lines 81-84)', () => {
  it('returns 0 when the Date fallback yields Infinity (mutants 339/340/341/342/343)', () => {
    // performance unavailable -> provider is the date fallback from the start.
    vi.stubGlobal('performance', undefined);
    vi.spyOn(Date, 'now').mockReturnValue(Infinity);
    const p = createSafeTimeProvider();
    expect(p.type).toBe('date');
    // Infinity fails the fallback validation (isFinite / typeof / <= checks),
    // so the safe last-resort 0 is returned. Mutants that accept it return Infinity.
    expect(p.now()).toBe(0);
  });

  it('returns 0 when the Date fallback yields a negative value (mutant 339)', () => {
    vi.stubGlobal('performance', undefined);
    vi.spyOn(Date, 'now').mockReturnValue(-5);
    const p = createSafeTimeProvider();
    expect(p.now()).toBe(0);
  });
});

describe('createMonotonicTimeSource - startValue sanitization (line 117)', () => {
  // The init `last` value is exposed by calling the wrapper with a source that
  // returns NaN: the wrapper then returns `last` unchanged.
  const badSource = () => NaN;

  it('keeps a valid non-negative startValue (mutants 355/360/361 force it to 0)', () => {
    const fn = createMonotonicTimeSource(badSource, 5);
    expect(fn()).toBe(5);
  });

  it('resets a NaN startValue to 0 (whole condition forced true, mutant 354)', () => {
    const fn = createMonotonicTimeSource(badSource, NaN);
    expect(fn()).toBe(0);
  });

  it('resets an Infinity startValue to 0 (isFinite mutants 357/358)', () => {
    const fn = createMonotonicTimeSource(badSource, Infinity);
    expect(fn()).toBe(0);
  });

  it('resets a negative startValue to 0 (>= 0 mutants 356/362/364)', () => {
    const fn = createMonotonicTimeSource(badSource, -5);
    expect(fn()).toBe(0);
  });

  it('defaults to 0 when startValue is omitted', () => {
    const fn = createMonotonicTimeSource(badSource);
    expect(fn()).toBe(0);
  });
});

describe('createMonotonicTimeSource - reading validation & monotonicity (line 121)', () => {
  it('repairs NaN/invalid readings to the last good value (mutants 369/370/371)', () => {
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
