import { describe, it, expect } from 'vitest';
import type { CountdownSnapshot } from '../model/countdown-snapshot';
import {
  buildSnapshot,
  assertSnapshotState,
  assertSnapshotCompleted,
  assertRemainingSeconds,
  TimerState,
} from '../../testing-utils';

/**
 * Captures the message of the Error thrown by `fn`. Fails loudly if nothing throws,
 * so an assertion that should produce an error can compare the EXACT message string.
 */
function captureMessage(fn: () => void): string {
  try {
    fn();
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error('expected the assertion to throw, but it did not');
}

describe('assertions.ts mutation coverage', () => {
  describe('assertSnapshotState', () => {
    it('throws an exact, fully-formatted default message including the details suffix', () => {
      const snapshot = buildSnapshot({ totalSeconds: 5, state: TimerState.RUNNING });

      // Exact-message oracle kills: empty fn body, inverted/short-circuited `if (!details)`,
      // empty default message, empty details template, and `??` -> `&&` mutations.
      const message = captureMessage(() => assertSnapshotState(snapshot, TimerState.STOPPED));
      expect(message).toBe('Unexpected countdown state: expected STOPPED but received RUNNING');
    });

    it('does not throw when the state matches', () => {
      const snapshot = buildSnapshot({ totalSeconds: 5, state: TimerState.RUNNING });
      expect(() => assertSnapshotState(snapshot, TimerState.RUNNING)).not.toThrow();
    });
  });

  describe('assertSnapshotCompleted', () => {
    it('throws the exact default message (no spurious ": undefined" details suffix)', () => {
      // totalSeconds === 0 but NOT marked completed -> must still throw.
      const notCompleted = buildSnapshot({ totalSeconds: 0, state: TimerState.RUNNING });
      expect(notCompleted.totalSeconds).toBe(0);
      expect(notCompleted.isCompleted).toBe(false);

      const message = captureMessage(() => assertSnapshotCompleted(notCompleted));
      expect(message).toBe('Countdown should be completed');
    });

    it('throws when isCompleted is true but totalSeconds is non-zero', () => {
      // Distinguishes `||` from `&&` and the `totalSeconds !== 0` -> `false` mutation.
      const inconsistent: CountdownSnapshot = {
        ...buildSnapshot({ totalSeconds: 5, state: TimerState.RUNNING }),
        isCompleted: true,
      };
      expect(inconsistent.totalSeconds).toBe(5);
      expect(inconsistent.isCompleted).toBe(true);

      expect(() => assertSnapshotCompleted(inconsistent)).toThrow('Countdown should be completed');
    });

    it('does not throw for a genuinely completed snapshot', () => {
      const completed = buildSnapshot({ totalSeconds: 0, state: TimerState.STOPPED });
      expect(completed.isCompleted).toBe(true);
      expect(() => assertSnapshotCompleted(completed)).not.toThrow();
    });
  });

  describe('assertRemainingSeconds', () => {
    /**
     * EQUIVALENT MUTANT (Stryker id 595) — testing-utils/assertions.ts L31:7-31:35
     * ConditionalExpression: `typeof expected !== 'number'` -> `false`, i.e. the guard becomes
     * `false || !Number.isFinite(expected)` === `!Number.isFinite(expected)`.
     * Unobservable: `Number.isFinite(x)` returns false for EVERY non-number type, so
     * `typeof x !== 'number'` always implies `!Number.isFinite(x)`. The left operand is fully
     * subsumed by the right and can never independently decide the guard; no public-API input
     * distinguishes the two forms. Left as an honest, explained equivalent survivor.
     * (The byte-identical whole-`if`-test -> false sibling, id 593, IS killable and is already
     * killed by the `rejects non-finite expected values` test below via NaN / Infinity.)
     */
    it('rejects non-finite expected values', () => {
      const snapshot = buildSnapshot({ totalSeconds: 5, state: TimerState.RUNNING });
      expect(() => assertRemainingSeconds(snapshot, Number.NaN)).toThrow(
        'Expected remaining seconds must be a finite number'
      );
      expect(() => assertRemainingSeconds(snapshot, Number.POSITIVE_INFINITY)).toThrow(
        'Expected remaining seconds must be a finite number'
      );
    });

    it('uses subtraction (not addition) for the delta', () => {
      const snapshot = buildSnapshot({ totalSeconds: 5, state: TimerState.RUNNING });
      // delta = |5 - 5| = 0 -> no throw. If the `-` became `+`, delta would be |5 + 5| = 10 -> throw.
      expect(() => assertRemainingSeconds(snapshot, 5, 0)).not.toThrow();
    });

    it('throws an exact, fully-formatted default message including the details suffix', () => {
      const snapshot = buildSnapshot({ totalSeconds: 5, state: TimerState.RUNNING });

      const message = captureMessage(() => assertRemainingSeconds(snapshot, 0, 0));
      expect(message).toBe('Unexpected remaining seconds: expected 0±0 but received 5');
    });
  });
});
