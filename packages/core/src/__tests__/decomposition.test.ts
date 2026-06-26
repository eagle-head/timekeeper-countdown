import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { buildSnapshot } from '../api/countdown-engine';
import { TimerState } from '../state/state-machine';
import {
  SECONDS_PER_YEAR,
  SECONDS_PER_WEEK,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
  WEEKS_PER_YEAR,
  DAYS_PER_WEEK,
} from '../time/constants';

const partsOf = (totalSeconds: number) => buildSnapshot(totalSeconds, totalSeconds, TimerState.IDLE).parts;

const reconstruct = (p: ReturnType<typeof partsOf>) =>
  p.years * SECONDS_PER_YEAR +
  p.weeks * SECONDS_PER_WEEK +
  p.days * SECONDS_PER_DAY +
  p.hours * SECONDS_PER_HOUR +
  p.minutes * SECONDS_PER_MINUTE +
  p.seconds;

describe('decomposition — reconstruction law (bug #5)', () => {
  it('the [364d, 365d) dead zone must NOT collapse to all-zero', () => {
    const p = partsOf(31449600); // exactly 364 days = 52 weeks
    expect([p.years, p.weeks, p.days]).not.toEqual([0, 0, 0]);
    expect(reconstruct(p)).toBe(31449600);
  });

  it('exactly 365 days reconstructs to exactly 365 days (no spurious extra day)', () => {
    const p = partsOf(31536000); // 365 days
    expect(reconstruct(p)).toBe(31536000);
    expect(p.totalDays).toBe(365);
    expect(p.years).toBe(1);
  });

  it('decomposes a rich duration 1y 2w 3d 4h 5m 6s exactly', () => {
    const total =
      1 * SECONDS_PER_YEAR + 2 * SECONDS_PER_WEEK + 3 * SECONDS_PER_DAY + 4 * SECONDS_PER_HOUR + 5 * SECONDS_PER_MINUTE + 6;
    const p = partsOf(total);
    expect(p).toMatchObject({ years: 1, weeks: 2, days: 3, hours: 4, minutes: 5, seconds: 6 });
    expect(reconstruct(p)).toBe(total);
  });

  it('computes the cumulative total* fields independently of the calendar breakdown', () => {
    const p = partsOf(3 * SECONDS_PER_DAY + 5 * SECONDS_PER_HOUR + 7 * SECONDS_PER_MINUTE + 9); // 3d 5h 7m 9s
    expect(p.totalDays).toBe(3);
    expect(p.totalHours).toBe(3 * 24 + 5); // 77
    expect(p.totalMinutes).toBe((3 * 24 + 5) * 60 + 7); // 4627
    // and they are floors of the total, not the per-unit remainders
    const big = partsOf(90061); // 1d 1h 1m 1s
    expect(big.totalDays).toBe(1);
    expect(big.totalHours).toBe(25);
    expect(big.totalMinutes).toBe(1501);
  });

  it('PROPERTY: total* fields equal the floored totals for any input', () => {
    fc.assert(
      fc.property(fc.nat({ max: 40 * SECONDS_PER_YEAR }), s => {
        const p = partsOf(s);
        expect(p.totalDays).toBe(Math.floor(s / SECONDS_PER_DAY));
        expect(p.totalHours).toBe(Math.floor(s / SECONDS_PER_HOUR));
        expect(p.totalMinutes).toBe(Math.floor(s / SECONDS_PER_MINUTE));
      }),
      { numRuns: 1000 }
    );
  });

  it('PROPERTY: parts always reconstruct totalSeconds and stay within their unit ranges', () => {
    fc.assert(
      fc.property(fc.oneof(fc.nat({ max: 40 * SECONDS_PER_YEAR }), fc.maxSafeNat()), s => {
        const p = partsOf(s);
        expect(reconstruct(p)).toBe(s);
        expect(p.weeks).toBeGreaterThanOrEqual(0);
        expect(p.weeks).toBeLessThanOrEqual(WEEKS_PER_YEAR); // 0..52
        expect(p.days).toBeGreaterThanOrEqual(0);
        expect(p.days).toBeLessThanOrEqual(DAYS_PER_WEEK - 1); // 0..6
        expect(p.hours).toBeLessThanOrEqual(23);
        expect(p.minutes).toBeLessThanOrEqual(59);
        expect(p.seconds).toBeLessThanOrEqual(59);
      }),
      { numRuns: 3000 }
    );
  });

  it('PROPERTY: the coarse fields never all read zero while a day or more remains', () => {
    fc.assert(
      fc.property(fc.integer({ min: SECONDS_PER_DAY, max: 40 * SECONDS_PER_YEAR }), s => {
        const p = partsOf(s);
        expect(p.years + p.weeks + p.days).toBeGreaterThan(0);
      }),
      { numRuns: 2000 }
    );
  });
});
