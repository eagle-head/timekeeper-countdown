import { describe, it, expect } from 'vitest';
import { Formatter, formatSeconds as formatSecondsDirect } from '../format/formatter';

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
