import { describe, it, expect } from 'vitest';
import { buildSnapshot, buildSnapshotSequence, TimerState } from '../../testing-utils';

/**
 * Focused mutation-killing suite for testing-utils/snapshots.ts.
 * Every assertion targets observable output of the public buildSnapshot /
 * buildSnapshotSequence helpers, chosen so the surviving mutant would produce
 * a different value than the real implementation.
 */
describe('snapshots.ts mutation coverage', () => {
  describe('clampSeconds (via buildSnapshot)', () => {
    it('clamps negative seconds to zero', () => {
      // Real clampSeconds returns 0 for value <= 0. Mutants that empty/disable
      // the `if (value <= 0)` branch would let -5 fall through to Math.floor(-5).
      const snapshot = buildSnapshot({ initialSeconds: -5, totalSeconds: -5 });

      expect(snapshot.totalSeconds).toBe(0);
      expect(snapshot.initialSeconds).toBe(0);
      expect(snapshot.state).toBe(TimerState.STOPPED);
      expect(snapshot.parts.seconds).toBe(0);
    });

    it('treats NaN seconds as zero', () => {
      // Disabling/flipping the finite guard in clampSeconds would route NaN to
      // Math.floor(NaN) === NaN instead of returning 0.
      const snapshot = buildSnapshot({ totalSeconds: Number.NaN });

      expect(snapshot.totalSeconds).toBe(0);
      expect(snapshot.initialSeconds).toBe(0);
      expect(snapshot.parts.seconds).toBe(0);
      expect(snapshot.parts.totalMinutes).toBe(0);
    });

    it('treats Infinity seconds via the finite guard, not as a large value', () => {
      // The `||` -> `&&` mutant in clampSeconds would let Infinity skip the guard,
      // hit `value >= MAX_SAFE_INTEGER`, and return MAX_SAFE_INTEGER.
      const snapshot = buildSnapshot({ totalSeconds: Number.POSITIVE_INFINITY });

      expect(snapshot.totalSeconds).toBe(0);
      expect(snapshot.initialSeconds).toBe(0);
    });
  });

  describe('buildSnapshot seconds fallback chain', () => {
    it('uses the provided initialSeconds verbatim', () => {
      // `??` -> `&&` mutants on the fallback chain would coerce a provided
      // initialSeconds of 90 into 0 (X && 0) or into totalSeconds (X && total).
      const snapshot = buildSnapshot({ initialSeconds: 90, totalSeconds: 45 });

      expect(snapshot.initialSeconds).toBe(90);
      expect(snapshot.totalSeconds).toBe(45);
    });
  });

  describe('snapshot boolean flags', () => {
    it('marks isRunning false for non-running states', () => {
      // `state === TimerState.RUNNING` -> `true` would force isRunning true.
      const snapshot = buildSnapshot({ totalSeconds: 10, state: TimerState.PAUSED });

      expect(snapshot.isRunning).toBe(false);
      expect(snapshot.state).toBe(TimerState.PAUSED);
    });

    it('still reports isRunning true for the running state', () => {
      const snapshot = buildSnapshot({ totalSeconds: 10, state: TimerState.RUNNING });

      expect(snapshot.isRunning).toBe(true);
    });

    it('requires BOTH zero seconds AND stopped state for isCompleted', () => {
      // Targets the isCompleted `&&`: `&&` -> `||`, the full condition -> `true`,
      // and the right operand -> `true`. Each must keep these two cases false.
      const zeroButRunning = buildSnapshot({ totalSeconds: 0, state: TimerState.RUNNING });
      expect(zeroButRunning.isCompleted).toBe(false);

      const stoppedButNonZero = buildSnapshot({ totalSeconds: 30, state: TimerState.STOPPED });
      expect(stoppedButNonZero.isCompleted).toBe(false);

      const completed = buildSnapshot({ totalSeconds: 0, state: TimerState.STOPPED });
      expect(completed.isCompleted).toBe(true);
    });
  });

  describe('buildSnapshotSequence', () => {
    it('applies the provided initialSeconds to every snapshot', () => {
      // `initialSeconds ?? safeTotal` -> `initialSeconds && safeTotal` would
      // replace the provided 100 with safeTotal (4) on every snapshot.
      const snapshots = buildSnapshotSequence({
        initialSeconds: 100,
        totalSeconds: 4,
        step: 2,
        count: 3,
      });

      expect(snapshots.map(s => s.initialSeconds)).toEqual([100, 100, 100]);
      expect(snapshots.map(s => s.totalSeconds)).toEqual([4, 2, 0]);
      expect(snapshots.map(s => s.state)).toEqual([TimerState.RUNNING, TimerState.RUNNING, TimerState.STOPPED]);
    });
  });
});
