import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { Countdown, TimerState } from '../api/countdown';

// Drive the default time provider off the (faked) Date.now clock so that
// vi.advanceTimersByTime() deterministically advances the countdown, mirroring
// the pattern used in countdown.test.ts.
const mockedNow = vi.hoisted(() => vi.fn<() => number>(() => Date.now())) as Mock<() => number>;

vi.mock('../runtime/time-providers', async importOriginal => {
  const actual = await importOriginal<typeof import('../runtime/time-providers')>();
  return {
    ...actual,
    getCurrentTime: mockedNow,
    createSafeTimeProvider: vi.fn(() => ({
      now: mockedNow,
      isHighResolution: true,
      type: 'mock',
    })),
  };
});

describe('Countdown - mutation coverage (countdown.ts façade)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockedNow.mockReset();
    mockedNow.mockImplementation(() => Date.now());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  // Survivor 171: `if (!onStateChange) return;` -> `if (false) return;`
  // When onStateChange is omitted but onError is provided, the early return MUST
  // prevent calling the (undefined) onStateChange. The mutant would call it,
  // throw a TypeError, and route it to onError. So onError must NOT be invoked
  // by a normal state transition.
  it('does not route a state change to onError when onStateChange is omitted', () => {
    const onError = vi.fn();
    const countdown = Countdown(60, { onError });

    countdown.start(); // IDLE -> RUNNING transition

    expect(countdown.getCurrentState()).toBe(TimerState.RUNNING);
    expect(onError).not.toHaveBeenCalled();
  });

  // Companion to 171: when onStateChange is omitted and NO onError is given, a
  // transition must still be a silent no-op (must not throw).
  it('handles transitions silently when neither onStateChange nor onError is set', () => {
    const countdown = Countdown(30);
    expect(() => {
      countdown.start();
      countdown.pause();
      countdown.resume();
      countdown.stop();
    }).not.toThrow();
  });

  // Survivor 175: `if (snapshot.state !== lastState)` -> `if (true)`
  // onStateChange must fire ONLY on real transitions, not on every snapshot.
  // While RUNNING, per-second ticks emit snapshots with an unchanged state, so
  // onStateChange must not fire again. The mutant would fire it on every tick.
  it('only invokes onStateChange on real transitions, not on every tick', () => {
    const onStateChange = vi.fn();
    const countdown = Countdown(10, { onStateChange });

    countdown.start();
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenLastCalledWith(TimerState.RUNNING);

    onStateChange.mockClear();

    // Three whole-second ticks while staying RUNNING.
    vi.advanceTimersByTime(3100);
    expect(countdown.getCurrentState()).toBe(TimerState.RUNNING);
    expect(onStateChange).not.toHaveBeenCalled();
  });

  // Extra guard for 175: the very first (initial) engine emit is IDLE and must
  // not be treated as a transition (lastState already IDLE).
  it('does not emit a state change for the initial IDLE snapshot', () => {
    const onStateChange = vi.fn();
    Countdown(15, { onStateChange });

    // Construction subscribes and receives one IDLE snapshot synchronously.
    expect(onStateChange).not.toHaveBeenCalled();
  });

  // Survivor 199: the `finally { engine.destroy(); }` block -> `{}`.
  // destroy() must tear down the underlying engine/timer, leaving no scheduled
  // work. The mutant only unsubscribes and leaks the running interval.
  it('clears all scheduled timer work on destroy', () => {
    const countdown = Countdown(60);
    countdown.start();
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    countdown.destroy();

    expect(vi.getTimerCount()).toBe(0);
  });
});

// Survivor 156: `CountdownEngine(initialSeconds, { onError })` -> `(..., {})`.
// The façade must hand its onError down to the engine; otherwise engine/timer
// internal errors never reach the consumer. We mock the Timer to surface an
// internal error and assert it propagates to the user-supplied onError.
describe('Countdown - mutation coverage (engine wiring)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('forwards an internal timer error to the user onError (engine receives onError)', async () => {
    let timerCallbacks: { onError: (error: Error) => void } | undefined;

    vi.doMock('../runtime/timer', () => ({
      Timer: vi.fn((initial: number, callbacks: { onError: (error: Error) => void }) => {
        timerCallbacks = callbacks;
        return {
          start: vi.fn(() => true),
          stop: vi.fn(),
          reset: vi.fn(),
          destroy: vi.fn(),
          getTotalSeconds: vi.fn(() => initial),
          setSeconds: vi.fn(),
          setInitialValue: vi.fn(),
          getInitialValue: vi.fn(() => initial),
          isRunning: vi.fn(() => false),
        };
      }),
    }));

    const { Countdown: MockedCountdown } = await import('../api/countdown');
    const onError = vi.fn();
    MockedCountdown(60, { onError });

    expect(timerCallbacks).toBeDefined();
    // Simulate the timer surfacing an internal error.
    timerCallbacks!.onError(new Error('timer boom'));

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onError.mock.calls[0][0].message).toBe('timer boom');

    vi.doUnmock('../runtime/timer');
  });
});
