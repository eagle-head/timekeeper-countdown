import { describe, it, expect, vi, afterEach } from 'vitest';
import fc from 'fast-check';
import { createSafeTimeProvider } from '../runtime/time-providers';

/**
 * Trust-boundary suite for src/runtime/time-providers.ts `isValidTime`.
 *
 * createSafeTimeProvider validates every reading coming from the GLOBAL
 * performance.now() / Date.now() — an UNTRUSTED input boundary the tests stub via
 * vi.stubGlobal / vi.spyOn. `isValidTime` is the sole guard that rejects hostile
 * readings, and its correctness hinges on `Number.isFinite`'s NO-coercion semantics
 * (see the code comment: the global `isFinite` would coerce '5'/''/null/[]/true into
 * finite numbers). Stryker has NO mutator that swaps `Number.isFinite` for the global
 * `isFinite`, so mutation score stays 100% while such a regression would silently LEAK
 * coerced clock values into downstream elapsed-time math. These tests pin that contract
 * at ALL THREE call sites (init probe, now(), Date.now fallback) — the partitions the
 * existing mutation suite leaves open (it only exercises the coercion family via a single
 * '5' at the now() site).
 *
 * ── EQUIVALENT surviving mutants in this file (documented, deliberately NOT tested) ──
 * The following Stryker survivors are genuinely UNOBSERVABLE through the public surface,
 * so no oracle can kill them — they are equivalent mutants, not coverage gaps:
 *   • L60 StringLiteral `throw new Error('performance.now() not available or invalid')` -> ""
 *     Thrown inside initializeProvider's try and immediately swallowed by the bare `catch`
 *     that sets currentProvider = fallbackProvider. The message is never read; only the
 *     (message-independent) fallback assignment is observable.
 *   • L76 StringLiteral `throw new Error('Invalid time value returned')` -> ""
 *     Thrown inside now()'s try and swallowed by the local `catch` that runs the fallback
 *     path; the message text never surfaces through now()/type/isHighResolution.
 *   • L79 ConditionalExpression `if (currentProvider !== fallbackProvider)` -> true
 *     Forcing it true only self-reassigns currentProvider = fallbackProvider when it is
 *     ALREADY fallbackProvider (a same-reference no-op); resulting state is identical.
 * (Out of scope, pre-existing debt — createMonotonicTimeSource L120's `typeof` redundancy
 * and `next < last` vs `<=` off-by-one — are unrelated to this change and not addressed here.)
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

/**
 * Families that `Number.isFinite` rejects but the GLOBAL `isFinite` would coerce-and-accept:
 * Number('') === 0, Number('  ') === 0, Number([]) === 0, Number(null) === 0,
 * Number(true) === 1, Number(false) === 0, Number('5') === 5, Number([5]) === 5.
 * A `Number.isFinite` -> global `isFinite` regression would accept every one of these and
 * leak the coerced value; each case below is red under that regression.
 */
const COERCION_TRAPS: [string, unknown][] = [
  ['numeric string', '5'],
  ['empty string', ''],
  ['whitespace string', '  '],
  ['null', null],
  ['empty array', []],
  ['single-element array', [5]],
  ['boolean true', true],
  ['boolean false', false],
];

describe('isValidTime trust boundary — INIT probe rejects coercion traps', () => {
  for (const [name, bad] of COERCION_TRAPS) {
    it(`falls back to the date provider when performance.now() yields ${name} at init`, () => {
      stubPerf(bad);
      const p = createSafeTimeProvider();
      // A global-isFinite regression would coerce-accept the reading and keep 'performance'.
      expect(p.type).toBe('date');
      expect(p.isHighResolution).toBe(false);
    });
  }
});

describe('isValidTime trust boundary — Date.now fallback never leaks coercion traps', () => {
  for (const [name, bad] of COERCION_TRAPS) {
    it(`returns the safe 0 when Date.now() yields ${name}`, () => {
      vi.stubGlobal('performance', undefined); // no performance -> init picks the date fallback
      vi.spyOn(Date, 'now').mockReturnValue(bad as number);
      const p = createSafeTimeProvider();
      expect(p.type).toBe('date');
      const r = p.now();
      // A global-isFinite regression would return the coerced/raw value instead of 0.
      expect(r).toBe(0);
      expect(typeof r).toBe('number');
      expect(Number.isFinite(r)).toBe(true);
    });
  }
});

describe('isValidTime trust boundary — now() falls back on every coercion trap, never leaks', () => {
  for (const [name, bad] of COERCION_TRAPS) {
    it(`falls back and never returns ${name} from now()`, () => {
      stubPerf(1000, bad); // valid init reading, then a hostile reading from now()
      const p = createSafeTimeProvider();
      expect(p.type).toBe('performance'); // chosen at init
      const r = p.now();
      expect(p.type).toBe('date'); // permanent switch after the bad reading
      expect(typeof r).toBe('number');
      expect(Number.isFinite(r)).toBe(true);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).not.toBe(bad); // never leak the raw hostile value
    });
  }
});

describe('createSafeTimeProvider — totality of now() (property)', () => {
  // Universal law: for ANY behavior of the untrusted global clocks — including NaN,
  // ±Infinity, negatives, out-of-range, non-numbers and coercion traps in any order —
  // now() must be TOTAL: always a finite number in [0, MAX_SAFE_INTEGER], never throwing.
  const hostileReading = fc.oneof(
    fc.double(), // full double range incl. NaN and ±Infinity (fast-check defaults)
    fc.integer(),
    fc.constantFrom(
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      0,
      -0,
      -1,
      Number.MAX_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER + 1,
      1e308,
      -1e308
    ),
    fc.string(),
    fc.constantFrom(null, undefined, true, false, '5', '')
  );

  // Build a vi.fn that yields `vals` in order, then repeats the last value forever.
  const seq = (vals: unknown[]) => {
    const fn = vi.fn();
    vals.forEach((v, i) =>
      i === vals.length - 1 ? fn.mockReturnValue(v as number) : fn.mockReturnValueOnce(v as number)
    );
    return fn;
  };

  it('now() is always a finite number in [0, MAX_SAFE_INTEGER] and never throws, for ANY clock behavior', () => {
    fc.assert(
      fc.property(
        fc.array(hostileReading, { minLength: 1, maxLength: 6 }),
        fc.array(hostileReading, { minLength: 1, maxLength: 6 }),
        (perfVals, dateVals) => {
          vi.stubGlobal('performance', { now: seq(perfVals) });
          const dateSpy = vi.spyOn(Date, 'now').mockImplementation(seq(dateVals) as unknown as () => number);
          try {
            const provider = createSafeTimeProvider();
            for (let i = 0; i < 8; i += 1) {
              const r = provider.now(); // must NOT throw
              expect(typeof r).toBe('number');
              expect(Number.isNaN(r)).toBe(false);
              expect(Number.isFinite(r)).toBe(true);
              expect(r).toBeGreaterThanOrEqual(0);
              expect(r).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
            }
          } finally {
            // Restore inside the run so fast-check's own inter-run Date.now stays sane.
            dateSpy.mockRestore();
            vi.unstubAllGlobals();
          }
        }
      ),
      { numRuns: 1000 }
    );
  });
});
