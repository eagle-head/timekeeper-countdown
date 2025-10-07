import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdown } from '../use-countdown';
import type { UseCountdownControls } from '../use-countdown';
import { createFakeTimeProvider } from '@timekeeper-countdown/core/testing-utils';
import { TimerState, CountdownEngine } from '@timekeeper-countdown/core';
import type { CountdownSnapshot, CountdownEngineOptions, CountdownEngineInstance } from '@timekeeper-countdown/core';
import * as Core from '@timekeeper-countdown/core';

const advanceTime = (ms: number, options: { tickMs?: number } = {}) => {
  const { tickMs = ms } = options;
  vi.advanceTimersByTime(tickMs);
};

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('engine should respect fake time provider outside React', () => {
    const fakeTime = createFakeTimeProvider({ startMs: 0 });
    const engine = CountdownEngine(3, {
      tickIntervalMs: 10,
      timeProvider: fakeTime,
    });

    const totals: number[] = [];
    const subscription = engine.subscribe(snapshot => {
      totals.push(snapshot.totalSeconds);
    });

    expect(engine.start()).toBe(true);
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    fakeTime.advance(1000);
    vi.advanceTimersByTime(1000);
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    const snapshotAfterAdvance = engine.getSnapshot();
    subscription.unsubscribe();
    engine.destroy();
    expect(snapshotAfterAdvance.totalSeconds).toBe(2);
    expect(totals).toEqual([3, 3, 3, 2]);
  });

  it('should expose initial snapshot in idle state', () => {
    const { result } = renderHook(() => useCountdown(90));

    expect(result.current.totalSeconds).toBe(90);
    expect(result.current.state).toBe(result.current.snapshot.state);
    expect(result.current.isRunning).toBe(false);
  });

  it('should auto start and tick when configured', async () => {
    const fakeTime = createFakeTimeProvider({ startMs: 0 });
    const { result } = renderHook(() =>
      useCountdown(3, {
        autoStart: true,
        tickIntervalMs: 10,
        timeProvider: fakeTime,
      })
    );

    expect(result.current.totalSeconds).toBe(3);

    await act(async () => {});
    expect(result.current.state).toBe(TimerState.RUNNING);

    act(() => {
      fakeTime.advance(1000);
      advanceTime(1000);
    });

    await act(async () => {});
    expect(result.current.totalSeconds).toBe(2);
    expect(result.current.isRunning).toBe(true);
  });

  it('should support manual controls', async () => {
    const fakeTime = createFakeTimeProvider({ startMs: 0 });
    const { result } = renderHook(() =>
      useCountdown(5, {
        tickIntervalMs: 10,
        timeProvider: fakeTime,
      })
    );

    act(() => {
      expect(result.current.start()).toBe(true);
    });

    await act(async () => {});
    expect(result.current.isRunning).toBe(true);

    act(() => {
      fakeTime.advance(2000);
      advanceTime(2000);
    });

    await act(async () => {});
    expect(result.current.totalSeconds).toBeLessThan(5);

    act(() => {
      expect(result.current.pause()).toBe(true);
    });

    const pausedSeconds = result.current.totalSeconds;

    act(() => {
      fakeTime.advance(5000);
    });

    expect(result.current.totalSeconds).toBe(pausedSeconds);

    act(() => {
      expect(result.current.resume()).toBe(true);
      fakeTime.advance(1000);
      advanceTime(1000);
    });

    await act(async () => {});
    expect(result.current.totalSeconds).toBeLessThan(pausedSeconds);

    act(() => {
      expect(result.current.reset()).toBe(true);
    });

    await act(async () => {});
    expect(result.current.totalSeconds).toBe(5);

    act(() => {
      expect(result.current.start()).toBe(true);
    });

    await act(async () => {});
    expect(result.current.isRunning).toBe(true);

    act(() => {
      expect(result.current.stop()).toBe(true);
    });

    await act(async () => {});
    expect(result.current.totalSeconds).toBe(0);
    expect(result.current.isCompleted).toBe(true);
  });

  it('should return fallback values after teardown while keeping handlers wired', async () => {
    const onSnapshot = vi.fn();
    const onStateChange = vi.fn();

    const { result, unmount } = renderHook(() =>
      useCountdown(3, {
        onSnapshot,
        onStateChange,
        tickIntervalMs: 10,
      })
    );

    await act(async () => {});

    act(() => {
      expect(result.current.start()).toBe(true);
    });

    await act(async () => {});

    expect(onSnapshot).toHaveBeenCalled();
    expect(onStateChange).toHaveBeenCalledWith(
      TimerState.RUNNING,
      expect.objectContaining({ state: TimerState.RUNNING })
    );

    const controls: UseCountdownControls = { ...result.current };

    act(() => {
      unmount();
    });

    expect(controls.start()).toBe(false);
    expect(controls.pause()).toBe(false);
    expect(controls.resume()).toBe(false);
    expect(controls.stop()).toBe(false);
    expect(controls.reset()).toBe(false);
    expect(controls.setSeconds(42)).toBeUndefined();
  });

  it('should forward errors to the provided handler', async () => {
    const onError = vi.fn();
    const snapshot: CountdownSnapshot = {
      initialSeconds: 5,
      totalSeconds: 5,
      parts: {
        years: 0,
        weeks: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 5,
        totalDays: 0,
        totalHours: 0,
        totalMinutes: 0,
      },
      state: TimerState.IDLE,
      isRunning: false,
      isCompleted: false,
    };

    const engineOptionsCalls: Array<CountdownEngineOptions | undefined> = [];
    const engineSpy = vi.spyOn(Core, 'CountdownEngine');

    const createEngineInstance = (): CountdownEngineInstance => {
      const unsubscribe = vi.fn();
      return {
        start: vi.fn(() => true),
        pause: vi.fn(() => true),
        resume: vi.fn(() => true),
        reset: vi.fn(() => true),
        stop: vi.fn(() => true),
        setSeconds: vi.fn(),
        getSnapshot: vi.fn(() => snapshot),
        subscribe: vi.fn(listener => {
          listener(snapshot);
          return { unsubscribe };
        }),
        destroy: vi.fn(),
      };
    };

    engineSpy.mockImplementation((initialSeconds: number, options?: CountdownEngineOptions) => {
      engineOptionsCalls.push(options);
      return createEngineInstance();
    });

    let unmount: (() => void) | undefined;

    try {
      ({ unmount } = renderHook(() => useCountdown(5, { onError })));

      await act(async () => {});

      expect(onError).not.toHaveBeenCalled();

      let dispatcher: CountdownEngineOptions['onError'] | undefined;
      for (let index = engineOptionsCalls.length - 1; index >= 0; index -= 1) {
        const candidate = engineOptionsCalls[index];
        if (candidate && typeof candidate.onError === 'function') {
          dispatcher = candidate.onError;
          break;
        }
      }

      expect(dispatcher).toBeDefined();

      const error = new Error('engine failure');
      act(() => {
        dispatcher?.(error);
      });

      expect(onError).toHaveBeenCalledWith(error);
    } finally {
      engineSpy.mockRestore();
      unmount?.();
    }
  });
});
