import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdown } from '../use-countdown';
import { createFakeTimeProvider } from '@timekeeper-countdown/core/testing-utils';
import { TimerState } from '@timekeeper-countdown/core';
import * as Core from '@timekeeper-countdown/core';

// Behavior-based tests that exercise the hook's control plumbing, dependency wiring, and
// handler freshness — the obligations the original 6-test suite never asserted.
//
// IMPORTANT: the timeProvider must have a STABLE identity across renders. Creating it inside
// the render callback would change engineOptions every render and recreate the engine in a loop.
describe('useCountdown — control & wiring behavior', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval'] }));
  afterEach(() => vi.useRealTimers());

  it('setSeconds(value) while mounted updates the rendered totalSeconds', () => {
    const timeProvider = createFakeTimeProvider({ startMs: 0 });
    const { result } = renderHook(() => useCountdown(60, { timeProvider, tickIntervalMs: 10 }));
    act(() => {
      result.current.setSeconds(10);
    });
    expect(result.current.totalSeconds).toBe(10);
  });

  it('setSeconds rejects invalid input (engine contract propagates through the hook)', () => {
    const timeProvider = createFakeTimeProvider({ startMs: 0 });
    const { result } = renderHook(() => useCountdown(60, { timeProvider }));
    expect(() =>
      act(() => {
        result.current.setSeconds(NaN);
      })
    ).toThrow(/finite, non-negative integer/);
  });

  it('reset(n) while mounted updates totalSeconds and initialSeconds and returns true', () => {
    const timeProvider = createFakeTimeProvider({ startMs: 0 });
    const { result } = renderHook(() => useCountdown(60, { timeProvider }));
    let returned: boolean | undefined;
    act(() => {
      returned = result.current.reset(120);
    });
    expect(returned).toBe(true);
    expect(result.current.totalSeconds).toBe(120);
    expect(result.current.snapshot.initialSeconds).toBe(120);
  });

  it('controls return booleans reflecting the actual transition', () => {
    const timeProvider = createFakeTimeProvider({ startMs: 0 });
    const { result } = renderHook(() => useCountdown(60, { timeProvider, tickIntervalMs: 10 }));
    let pausedIdle: boolean | undefined;
    act(() => {
      pausedIdle = result.current.pause();
    });
    expect(pausedIdle).toBe(false);

    let started: boolean | undefined;
    act(() => {
      started = result.current.start();
    });
    expect(started).toBe(true);
    expect(result.current.state).toBe(TimerState.RUNNING);

    let startedAgain: boolean | undefined;
    act(() => {
      startedAgain = result.current.start();
    });
    expect(startedAgain).toBe(false);
  });

  it('autoStart starts the engine on mount; omitting it stays idle', () => {
    const ticking = createFakeTimeProvider({ startMs: 0 });
    const { result } = renderHook(() =>
      useCountdown(3, { autoStart: true, timeProvider: ticking, tickIntervalMs: 10 })
    );
    expect(result.current.isRunning).toBe(true);
    act(() => {
      ticking.advance(1000);
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.totalSeconds).toBe(2);

    const idleProvider = createFakeTimeProvider({ startMs: 0 });
    const { result: idle } = renderHook(() => useCountdown(3, { timeProvider: idleProvider, tickIntervalMs: 10 }));
    expect(idle.current.isRunning).toBe(false);
    expect(idle.current.state).toBe(TimerState.IDLE);
  });

  it('forwards engine events to the option callbacks', () => {
    const onStateChange = vi.fn();
    const onSnapshot = vi.fn();
    const ticking = createFakeTimeProvider({ startMs: 0 });
    const { result } = renderHook(() =>
      useCountdown(3, { timeProvider: ticking, tickIntervalMs: 10, onStateChange, onSnapshot })
    );
    act(() => {
      result.current.start();
    });
    expect(onStateChange).toHaveBeenCalledWith(
      TimerState.RUNNING,
      expect.objectContaining({ state: TimerState.RUNNING })
    );
    act(() => {
      ticking.advance(1000);
      vi.advanceTimersByTime(1000);
    });
    expect(onSnapshot).toHaveBeenCalled();
  });
});

describe('useCountdown — dependency wiring & handler freshness', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval'] }));
  afterEach(() => vi.useRealTimers());

  it('does NOT recreate the engine when only callback identities change', () => {
    const ctorSpy = vi.spyOn(Core, 'CountdownEngine');
    const timeProvider = createFakeTimeProvider({ startMs: 0 });
    const { rerender } = renderHook(
      ({ cb }: { cb: () => void }) => useCountdown(60, { timeProvider, tickIntervalMs: 10, onSnapshot: cb }),
      { initialProps: { cb: () => {} } }
    );
    const afterMount = ctorSpy.mock.calls.length;
    rerender({ cb: () => {} });
    rerender({ cb: () => {} });
    expect(ctorSpy.mock.calls.length).toBe(afterMount);
    ctorSpy.mockRestore();
  });

  it('uses the latest callback after a rerender (handlersRef stays fresh, not stale)', () => {
    const first = vi.fn();
    const second = vi.fn();
    const ticking = createFakeTimeProvider({ startMs: 0 });
    const { rerender, result } = renderHook(
      ({ cb }: { cb: () => void }) => useCountdown(5, { timeProvider: ticking, tickIntervalMs: 10, onSnapshot: cb }),
      { initialProps: { cb: first } }
    );
    act(() => {
      result.current.start();
    });
    rerender({ cb: second });
    first.mockClear();
    second.mockClear();
    act(() => {
      ticking.advance(1000);
      vi.advanceTimersByTime(1000);
    });
    expect(second).toHaveBeenCalled();
    expect(first).not.toHaveBeenCalled();
  });

  it('recreates the engine when tickIntervalMs changes (engineOptions is a real dependency)', () => {
    const ctorSpy = vi.spyOn(Core, 'CountdownEngine');
    const timeProvider = createFakeTimeProvider({ startMs: 0 });
    const { rerender } = renderHook(
      ({ tick }: { tick: number }) => useCountdown(60, { timeProvider, tickIntervalMs: tick }),
      { initialProps: { tick: 100 } }
    );
    const afterMount = ctorSpy.mock.calls.length;
    rerender({ tick: 20 });
    expect(ctorSpy.mock.calls.length).toBeGreaterThan(afterMount);
    ctorSpy.mockRestore();
  });

  it('recreates the engine and resets when initialSeconds changes', () => {
    const timeProvider = createFakeTimeProvider({ startMs: 0 });
    const { result, rerender } = renderHook(
      ({ s }: { s: number }) => useCountdown(s, { timeProvider, tickIntervalMs: 10 }),
      { initialProps: { s: 60 } }
    );
    expect(result.current.totalSeconds).toBe(60);
    rerender({ s: 20 });
    expect(result.current.totalSeconds).toBe(20);
  });

  it('exposes the parts breakdown derived from the engine snapshot', () => {
    const timeProvider = createFakeTimeProvider({ startMs: 0 });
    const { result } = renderHook(() => useCountdown(3661, { timeProvider })); // 1h 1m 1s
    expect(result.current.parts).toMatchObject({ hours: 1, minutes: 1, seconds: 1 });
    expect(result.current.totalSeconds).toBe(3661);
  });

  it('controls are no-ops returning fallbacks after unmount', () => {
    const timeProvider = createFakeTimeProvider({ startMs: 0 });
    const { result, unmount } = renderHook(() => useCountdown(60, { timeProvider }));
    const controls = result.current;
    unmount();
    expect(controls.start()).toBe(false);
    expect(controls.reset(10)).toBe(false);
    expect(controls.setSeconds(5)).toBeUndefined();
  });
});
