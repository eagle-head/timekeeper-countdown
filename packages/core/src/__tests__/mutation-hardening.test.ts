import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CountdownEngine } from '../api/countdown-engine';
import { TimerState } from '../state/state-machine';
import { Timer } from '../runtime/timer';
import { formatSeconds, formatMinutes, formatHours, formatTime } from '../format/formatter';
import { buildSnapshot as buildTestSnapshot } from '../../testing-utils/snapshots';
import { assertRemainingSeconds } from '../../testing-utils/assertions';

// Second-pass kill-tests for surviving mutants Stryker flagged that are genuinely killable
// (the remaining survivors are documented equivalent mutants). Each assertion targets a
// specific mutated line by making its observable output differ from the real code.

describe('CountdownEngine constructor validation (kills sanitize guard mutants)', () => {
  it.each([NaN, 1.5, Infinity, -Infinity])('throws on %p (not a finite integer)', v => {
    expect(() => CountdownEngine(v as number)).toThrow(/finite, non-negative integer/);
  });
  it('throws on a non-number', () => {
    expect(() => CountdownEngine('5' as unknown as number)).toThrow(/finite, non-negative integer/);
  });
  it('throws on a negative integer', () => {
    expect(() => CountdownEngine(-1)).toThrow(/non-negative/);
  });
  it('throws above MAX_SAFE_INTEGER', () => {
    expect(() => CountdownEngine(Number.MAX_SAFE_INTEGER + 1)).toThrow(/exceeds maximum/);
  });
  it('accepts 0 and a positive integer', () => {
    expect(CountdownEngine(0).getSnapshot().totalSeconds).toBe(0);
    expect(CountdownEngine(7).getSnapshot().totalSeconds).toBe(7);
  });
});

describe('CountdownEngine lifecycle reflects transitions in the snapshot (kills guard-body mutants)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const engine = () => CountdownEngine(60, { timeProvider: () => 0, tickIntervalMs: 100 });

  it('start() IDLE -> RUNNING and returns true', () => {
    const e = engine();
    expect(e.start()).toBe(true);
    expect(e.getSnapshot().state).toBe(TimerState.RUNNING);
    expect(e.getSnapshot().isRunning).toBe(true);
  });
  it('start() while running returns false and stays RUNNING', () => {
    const e = engine();
    e.start();
    expect(e.start()).toBe(false);
    expect(e.getSnapshot().state).toBe(TimerState.RUNNING);
  });
  it('pause() RUNNING -> PAUSED and returns true', () => {
    const e = engine();
    e.start();
    expect(e.pause()).toBe(true);
    expect(e.getSnapshot().state).toBe(TimerState.PAUSED);
  });
  it('pause() while idle returns false and stays IDLE', () => {
    const e = engine();
    expect(e.pause()).toBe(false);
    expect(e.getSnapshot().state).toBe(TimerState.IDLE);
  });
  it('resume() PAUSED -> RUNNING and returns true', () => {
    const e = engine();
    e.start();
    e.pause();
    expect(e.resume()).toBe(true);
    expect(e.getSnapshot().state).toBe(TimerState.RUNNING);
  });
  it('resume() while not paused returns false', () => {
    const e = engine();
    expect(e.resume()).toBe(false);
    e.start();
    expect(e.resume()).toBe(false);
  });
});

describe('formatter input handling (kills extractSeconds/sanitize mutants)', () => {
  it('reads totalSeconds from a snapshot-like object', () => {
    expect(formatSeconds({ totalSeconds: 65 })).toBe('05');
    expect(formatMinutes({ totalSeconds: 125 })).toBe('02');
    expect(formatHours({ totalSeconds: 3 * 3600 + 5 })).toBe('03');
    expect(formatTime({ totalSeconds: 90 })).toEqual({ minutes: '01', seconds: '30' });
  });
  it('coerces null/undefined to zero', () => {
    expect(formatSeconds(null)).toBe('00');
    expect(formatMinutes(undefined)).toBe('00');
    expect(formatTime(null)).toEqual({ minutes: '00', seconds: '00' });
  });
  it('caps at MAX_SAFE_INTEGER so an over-max value matches the cap exactly', () => {
    expect(formatSeconds(Number.MAX_SAFE_INTEGER + 100)).toBe(formatSeconds(Number.MAX_SAFE_INTEGER));
    expect(formatTime(Number.MAX_SAFE_INTEGER + 100)).toEqual(formatTime(Number.MAX_SAFE_INTEGER));
  });
});

describe('testing-utils buildSnapshot clamps non-finite seconds (kills clamp guard mutants)', () => {
  it('clamps a NaN totalSeconds to 0', () => {
    expect(buildTestSnapshot({ totalSeconds: NaN }).totalSeconds).toBe(0);
  });
  it('clamps an Infinity initialSeconds to 0', () => {
    expect(buildTestSnapshot({ initialSeconds: Infinity, totalSeconds: 10 }).initialSeconds).toBe(0);
  });
});

describe('assertRemainingSeconds rejects a non-finite expected (kills guard mutant)', () => {
  const snap = buildTestSnapshot({ totalSeconds: 5 });
  it('throws on NaN expected', () => {
    expect(() => assertRemainingSeconds(snap, NaN)).toThrow(/finite number/);
  });
  it('throws on Infinity expected', () => {
    expect(() => assertRemainingSeconds(snap, Infinity)).toThrow(/finite number/);
  });
});

describe('Timer defensive setters ignore non-finite input (kills @internal guard mutants)', () => {
  const noopEvents = { onTick: () => {}, onComplete: () => {}, onError: () => {} };
  it('setSeconds(NaN) leaves totalSeconds unchanged', () => {
    const t = Timer(30, noopEvents, { timeProvider: () => 0 });
    t.setSeconds(NaN);
    expect(t.getTotalSeconds()).toBe(30);
  });
  it('setSeconds(Infinity) leaves totalSeconds unchanged', () => {
    const t = Timer(30, noopEvents, { timeProvider: () => 0 });
    t.setSeconds(Infinity);
    expect(t.getTotalSeconds()).toBe(30);
  });
  it('setInitialValue(NaN) leaves the initial value unchanged', () => {
    const t = Timer(30, noopEvents, { timeProvider: () => 0 });
    t.setInitialValue(NaN);
    expect(t.getInitialValue()).toBe(30);
  });
});
