import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CountdownEngine } from '../api/countdown-engine';

// The public seconds inputs (constructor, reset(n), setSeconds(n)) must share ONE validation
// policy: reject invalid input loudly (throw), never silently coerce. The @internal Timer keeps
// its defensive clamp as defense-in-depth, but the public engine fails fast and consistently.
describe('seconds input contract — validate & throw consistently', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const engine = () => CountdownEngine(60, { timeProvider: () => 0 });

  describe('setSeconds', () => {
    it('throws on negative', () => {
      expect(() => engine().setSeconds(-1)).toThrow('must be non-negative');
    });
    it('throws on NaN', () => {
      expect(() => engine().setSeconds(NaN)).toThrow('finite, non-negative integer');
    });
    it('throws on Infinity', () => {
      expect(() => engine().setSeconds(Infinity)).toThrow('finite, non-negative integer');
    });
    it('throws on a non-integer', () => {
      expect(() => engine().setSeconds(10.5)).toThrow('finite, non-negative integer');
    });
    it('throws above MAX_SAFE_INTEGER', () => {
      expect(() => engine().setSeconds(Number.MAX_SAFE_INTEGER + 1)).toThrow('exceeds maximum safe integer');
    });
    it('accepts a valid value and updates the snapshot', () => {
      const e = engine();
      e.setSeconds(8);
      expect(e.getSnapshot().totalSeconds).toBe(8);
    });
    it('accepts 0', () => {
      const e = engine();
      e.setSeconds(0);
      expect(e.getSnapshot().totalSeconds).toBe(0);
    });
  });

  describe('reset(n) (already strict — pinned for consistency)', () => {
    it('throws on negative', () => {
      expect(() => engine().reset(-1)).toThrow('must be non-negative');
    });
    it('throws on NaN', () => {
      expect(() => engine().reset(NaN)).toThrow('finite, non-negative integer');
    });
    it('updates initial and total on a valid value', () => {
      const e = engine();
      e.reset(120);
      const snap = e.getSnapshot();
      expect(snap.initialSeconds).toBe(120);
      expect(snap.totalSeconds).toBe(120);
    });
  });
});
