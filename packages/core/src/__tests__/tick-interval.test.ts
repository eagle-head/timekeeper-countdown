import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CountdownEngine } from '../api/countdown-engine';

// Bug #3: a non-finite/invalid tickIntervalMs must never reach setInterval as NaN/Infinity
// (which the runtime coerces to a ~0/1ms CPU tight-loop). Invalid -> default 100ms; valid -> clamp to >=10, floored.
describe('tick interval sanitization', () => {
  let setIntervalSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
  });
  afterEach(() => {
    setIntervalSpy.mockRestore();
    vi.useRealTimers();
  });

  const scheduledDelay = () => Number(setIntervalSpy.mock.calls.at(-1)?.[1]);

  it.each([
    ['NaN', NaN, 100],
    ['Infinity', Infinity, 100],
    ['-Infinity', -Infinity, 100],
    ['zero', 0, 100],
    ['negative', -5, 100],
    ['below-min', 1, 10],
    ['decimal-below-min', 5.9, 10],
    ['decimal', 10.9, 10],
    ['normal', 50, 50],
    ['large', 1000, 1000],
  ])('tickIntervalMs %s schedules a finite delay of %d ms', (_label, input, expected) => {
    const engine = CountdownEngine(60, { timeProvider: () => 0, tickIntervalMs: input as number });
    engine.start();
    const delay = scheduledDelay();
    expect(Number.isFinite(delay)).toBe(true);
    expect(delay).toBeGreaterThanOrEqual(10);
    expect(delay).toBe(expected);
  });

  it('default (omitted) tickIntervalMs schedules 100ms', () => {
    const engine = CountdownEngine(60, { timeProvider: () => 0 });
    engine.start();
    expect(scheduledDelay()).toBe(100);
  });
});
