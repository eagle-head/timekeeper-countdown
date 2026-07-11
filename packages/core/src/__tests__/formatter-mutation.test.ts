import { describe, it, expect } from 'vitest';
import { Formatter, formatSeconds as formatSecondsDirect } from '../format/formatter';
import { buildSnapshot } from '../api/countdown-engine';
import { TimerState } from '../state/state-machine';

/**
 * Mutation-killing tests for src/format/formatter.ts.
 *
 * Each test feeds an input that makes a specific mutated line produce a DIFFERENT
 * observable output than the real line, asserted through the public Formatter API.
 *
 * Note on decompose(): the formatter funnels every value through the canonical
 * lossless `decompose`, which itself clamps non-finite/negative input to 0. That
 * re-sanitization makes several of the inner-guard mutants equivalent (see
 * suspected_equivalent in the report) — the tests below target only the mutants
 * that survive that clamping and remain observably distinguishable.
 */
describe('Formatter mutation killers', () => {
  const formatter = Formatter();

  describe('sanitizeSeconds: non-finite guard (line 19)', () => {
    // Mutant 217: the whole guard condition -> false. For Infinity the real code
    // returns 0 early; with the guard removed Infinity falls through to the
    // `>= MAX_SAFE_INTEGER` branch and yields MAX_SAFE_INTEGER, producing huge
    // (non-"00") units. So requiring "00" output kills the mutant.
    it('treats Infinity as 0 across every unit', () => {
      expect(formatter.formatTime(Infinity)).toEqual({ minutes: '00', seconds: '00' });
      expect(formatter.formatSeconds(Infinity)).toBe('00');
      expect(formatter.formatMinutes(Infinity)).toBe('00');
      expect(formatter.formatHours(Infinity)).toBe('00');
      expect(formatter.formatYears(Infinity)).toBe('00');
    });

    it('treats a snapshot carrying Infinity as 0', () => {
      expect(formatter.formatYears({ totalSeconds: Infinity })).toBe('00');
    });
  });

  describe('sanitizeSeconds: MAX_SAFE_INTEGER clamp (line 27)', () => {
    // Mutant 228 (condition -> false) and 231 (clamp block -> {}): both let a value
    // strictly above MAX_SAFE_INTEGER bypass the clamp and reach Math.floor(value).
    // Real code clamps to MAX_SAFE_INTEGER (== ...991), whose seconds field is 31;
    // the mutant decomposes ...992, whose seconds field is 32. The clamp keeps the
    // two distinct over-max inputs collapsed to the same output, so:
    it('clamps over-max input to MAX_SAFE_INTEGER (seconds field stays 31)', () => {
      // sanity: MAX_SAFE_INTEGER itself decomposes to a 31-second remainder
      expect(formatter.formatSeconds(Number.MAX_SAFE_INTEGER)).toBe('31');
      // over-max input must clamp DOWN to MAX_SAFE_INTEGER, not floor to ...992
      expect(formatter.formatSeconds(Number.MAX_SAFE_INTEGER + 1)).toBe('31');
      expect(formatSecondsDirect(Number.MAX_SAFE_INTEGER + 1)).toBe('31');
      expect(formatter.formatTime(Number.MAX_SAFE_INTEGER + 1).seconds).toBe('31');
    });
  });
});

describe('clampSeconds negative-zero normalization (clamp.ts line 19, via buildSnapshot)', () => {
  // Mutant: EqualityOperator `value <= 0` -> `value < 0` in clampSeconds.
  //
  // The two operators disagree on exactly one finite input: negative zero. Every
  // other value <= 0 collapses to +0 under BOTH operators (for any strictly-negative
  // v, `v < 0` is true, so the mutant still returns 0), and every positive value
  // falls through under both. So -0 is the SOLE input that distinguishes them:
  //   - real: `-0 <= 0` is true  -> returns the canonical +0 literal.
  //   - mutant: `-0 < 0` is false -> falls through to `return Math.floor(-0)`, == -0.
  //
  // A snapshot must store a canonical non-negative integer, so a -0 total must be
  // normalized to +0. Object.is (which Vitest's toBe uses) distinguishes -0 from +0,
  // making the mutant observable through the public buildSnapshot API.
  it('stores canonical +0 (not -0) when the total is negative zero', () => {
    const negativeZero = -0;
    // Guard: make sure the fixture really is -0 (not constant-folded to +0), otherwise
    // the assertions below would not exercise the divergent branch at all.
    expect(Object.is(negativeZero, -0)).toBe(true);

    const snapshot = buildSnapshot(0, negativeZero, TimerState.STOPPED);

    // Load-bearing: real code yields +0 here; the mutant yields -0 -> these fail.
    expect(Object.is(snapshot.totalSeconds, 0)).toBe(true);
    expect(Object.is(snapshot.totalSeconds, -0)).toBe(false);

    // The rest of the snapshot stays canonical and completed under the real code.
    expect(snapshot.isCompleted).toBe(true);
    expect(snapshot.parts.seconds).toBe(0);
  });
});

/*
 * DOCUMENTED EQUIVALENT MUTANTS (proven unkillable — intentionally NOT tested).
 *
 * These survivors in this cluster (clamp.ts + formatter.ts) are observationally
 * identical to the real code: no public-API input distinguishes them, so writing a
 * "killing" test is impossible and any green test targeting them would be theater.
 *
 * 1. src/time/clamp.ts L23  EqualityOperator  `value >= MAX` -> `value > MAX`
 *    The only input the operators disagree on is value === Number.MAX_SAFE_INTEGER:
 *    the real guard returns MAX directly, while the mutant falls through to
 *    `return Math.floor(MAX)`. MAX_SAFE_INTEGER (2^53 - 1) is an integer, so
 *    Math.floor(MAX) === MAX — identical result (and MAX is positive, so no -0
 *    edge exists here as it does on line 19). => EQUIVALENT.
 *
 * 2. src/format/formatter.ts L12  ConditionalExpression -> true
 *    `if (target && typeof target.totalSeconds === 'number')` -> `if (target && true)`.
 *    The branches diverge only when `target` is truthy AND `target.totalSeconds` is
 *    NOT a number: the real code returns 0, the mutant returns that non-number value.
 *    But extractSeconds' result is ALWAYS funnelled through clampSeconds (partsOf =
 *    decompose(clampSeconds(extractSeconds(target)))), and clampSeconds' own type
 *    guard (`typeof value !== 'number'`) collapses any non-number back to 0 — the same
 *    value the real branch returns. Every divergent input therefore yields identical
 *    "00" output across all formatters. (The property read cannot throw differently:
 *    the real condition reads `target.totalSeconds` too.) => EQUIVALENT.
 *
 * 3. src/time/clamp.ts L15  ConditionalExpression -> false  (first operand `typeof value !== 'number'`)
 *    The guard is `typeof value !== 'number' || !Number.isFinite(value)`. Dropping the typeof
 *    operand leaves `!Number.isFinite(value)`, which is already true for EVERY non-number
 *    (Number.isFinite never coerces), so any input the typeof clause caught the finite clause
 *    catches too — the identical early `return 0` fires. The typeof operand is redundant
 *    defense-in-depth. => EQUIVALENT. (This mutant flips between Timeout/Survived across Stryker
 *    runs due to interval-test timeout nondeterminism; it is unkillable either way.)
 */
