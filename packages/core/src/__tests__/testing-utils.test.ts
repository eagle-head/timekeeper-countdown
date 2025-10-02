import { describe, it, expect } from 'vitest';
import {
  createFakeTimeProvider,
  buildSnapshot,
  buildSnapshotSequence,
  assertSnapshotState,
  assertSnapshotCompleted,
  assertRemainingSeconds,
  TimerState,
  toTimeProvider,
} from '../../testing-utils';

describe('Core testing utilities', () => {
  describe('createFakeTimeProvider', () => {
    it('should advance, set, and reset time deterministically', () => {
      const fake = createFakeTimeProvider({ startMs: 500, tickMs: 200 });

      expect(fake.now()).toBe(500);
      expect(fake.advance()).toBe(700);
      expect(fake.advance(50)).toBe(750);

      fake.set(1200);
      expect(fake.now()).toBe(1200);

      fake.reset();
      expect(fake.now()).toBe(500);
    });

    it('should clamp negative or non-finite values to zero', () => {
      const fake = createFakeTimeProvider({ startMs: -100, tickMs: 200 });

      expect(fake.now()).toBe(0);

      fake.set(-500);
      expect(fake.now()).toBe(0);

      fake.set(Number.NaN);
      expect(fake.now()).toBe(0);
    });

    it('should cap values above MAX_SAFE_INTEGER', () => {
      const fake = createFakeTimeProvider({ startMs: Number.MAX_SAFE_INTEGER + 100 });

      expect(fake.now()).toBe(Number.MAX_SAFE_INTEGER);

      fake.set(Number.MAX_SAFE_INTEGER + 500);
      expect(fake.now()).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should adapt fake provider into time provider view', () => {
      const fake = createFakeTimeProvider({ startMs: 250, highResolution: false });

      const provider = toTimeProvider(fake);

      expect(provider.now()).toBe(250);
      fake.advance(50);
      expect(provider.now()).toBe(300);
      expect(provider.isHighResolution).toBe(false);
      expect(provider.type).toBe('fake');
    });
  });

  describe('buildSnapshot helpers', () => {
    it('should build snapshots with computed parts', () => {
      const snapshot = buildSnapshot({ initialSeconds: 90, totalSeconds: 45, state: TimerState.RUNNING });

      expect(snapshot.totalSeconds).toBe(45);
      expect(snapshot.parts.seconds).toBe(45 % 60);
      expect(snapshot.isRunning).toBe(true);
    });

    it('should build snapshot sequences that decrement', () => {
      const snapshots = buildSnapshotSequence({ totalSeconds: 4, step: 2, count: 3 });

      expect(snapshots.map(item => item.totalSeconds)).toEqual([4, 2, 0]);
      expect(snapshots.at(-1)?.state).toBe(TimerState.STOPPED);
    });

    it('should default to a single snapshot when count is non-positive', () => {
      const snapshots = buildSnapshotSequence({ totalSeconds: 8, count: 0, step: 2 });

      expect(snapshots).toHaveLength(1);
      expect(snapshots[0]?.totalSeconds).toBe(8);
      expect(snapshots[0]?.state).toBe(TimerState.RUNNING);
    });

    it('should clamp non-numeric seconds to zero', () => {
      const snapshot = buildSnapshot({ totalSeconds: 'invalid' as unknown as number });

      expect(snapshot.totalSeconds).toBe(0);
      expect(snapshot.parts.totalMinutes).toBe(0);
      expect(snapshot.state).toBe(TimerState.STOPPED);
    });

    it('should cap extremely large seconds to MAX_SAFE_INTEGER', () => {
      const snapshot = buildSnapshot({ totalSeconds: Number.MAX_SAFE_INTEGER + 10 });

      expect(snapshot.totalSeconds).toBe(Number.MAX_SAFE_INTEGER);
      expect(snapshot.parts.totalMinutes).toBeGreaterThan(0);
      expect(snapshot.state).toBe(TimerState.IDLE);
    });

    it('should fallback to zero seconds when no values are provided', () => {
      const snapshot = buildSnapshot();

      expect(snapshot.initialSeconds).toBe(0);
      expect(snapshot.totalSeconds).toBe(0);
      expect(snapshot.isCompleted).toBe(true);
      expect(snapshot.state).toBe(TimerState.STOPPED);
    });
  });

  describe('assertion helpers', () => {
    it('should validate snapshot expectations', () => {
      const snapshot = buildSnapshot({ totalSeconds: 0, state: TimerState.STOPPED });

      expect(() => assertSnapshotState(snapshot, TimerState.STOPPED)).not.toThrow();
      expect(() => assertSnapshotCompleted(snapshot)).not.toThrow();
      expect(() => assertRemainingSeconds(snapshot, 0)).not.toThrow();
    });

    it('should throw when snapshot assertions fail', () => {
      const snapshot = buildSnapshot({ totalSeconds: 5, state: TimerState.RUNNING });

      expect(() => assertSnapshotState(snapshot, TimerState.STOPPED)).toThrow();
      expect(() => assertSnapshotCompleted(snapshot)).toThrow();
      expect(() => assertRemainingSeconds(snapshot, 0, 0)).toThrow();
    });

    it('should reject non-finite expected remaining seconds', () => {
      const snapshot = buildSnapshot({ totalSeconds: 5 });

      expect(() => assertRemainingSeconds(snapshot, Number.NaN)).toThrow(
        'Expected remaining seconds must be a finite number'
      );
      expect(() => assertRemainingSeconds(snapshot, Number.POSITIVE_INFINITY)).toThrow(
        'Expected remaining seconds must be a finite number'
      );
    });
  });
});
