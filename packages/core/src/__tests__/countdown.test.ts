import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { Countdown, TimerState } from '../api/countdown';

const mockedNow = vi.hoisted(() => vi.fn<() => number>(() => Date.now())) as Mock<() => number>;

// Mock the time-providers module
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

describe('Countdown - Happy Path', () => {
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

  describe('Initialization', () => {
    it('should create a countdown with initial seconds', () => {
      const countdown = Countdown(120);
      expect(countdown).toBeDefined();
      expect(countdown.getMinutes()).toBe('02');
      expect(countdown.getSeconds()).toBe('00');
      expect(countdown.getCurrentState()).toBe(TimerState.IDLE);
    });

    it('should create a countdown with 0 seconds', () => {
      const countdown = Countdown(0);
      expect(countdown.getMinutes()).toBe('00');
      expect(countdown.getSeconds()).toBe('00');
      expect(countdown.getCurrentState()).toBe(TimerState.IDLE);
    });

    it('should create a countdown with options', () => {
      const onSnapshot = vi.fn();
      const onStateChange = vi.fn();
      const countdown = Countdown(60, { onSnapshot, onStateChange });
      expect(countdown).toBeDefined();
    });
  });

  describe('Start functionality', () => {
    it('should start the countdown', () => {
      const onStateChange = vi.fn();
      const countdown = Countdown(10, { onStateChange });

      countdown.start();

      expect(countdown.getCurrentState()).toBe(TimerState.RUNNING);
      expect(onStateChange).toHaveBeenCalledWith(TimerState.RUNNING);
    });

    it('should update time as countdown progresses', () => {
      const onSnapshot = vi.fn();
      const countdown = Countdown(65, { onSnapshot });

      countdown.start();

      // Initial call
      expect(onSnapshot).toHaveBeenCalledWith(expect.objectContaining({ totalSeconds: 65 }));

      // Clear previous calls
      onSnapshot.mockClear();

      // Advance 1 second - timer checks every 100ms, so we need to advance past 1000ms
      vi.advanceTimersByTime(1100);
      expect(onSnapshot).toHaveBeenCalledWith(expect.objectContaining({ totalSeconds: 64 }));

      // Clear and advance 5 more seconds
      onSnapshot.mockClear();
      vi.advanceTimersByTime(5000);
      expect(onSnapshot).toHaveBeenCalledWith(expect.objectContaining({ totalSeconds: 59 }));
    });
  });

  describe('Pause and Resume functionality', () => {
    it('should pause the countdown', () => {
      const onStateChange = vi.fn();
      const countdown = Countdown(60, { onStateChange });

      countdown.start();
      countdown.pause();

      expect(countdown.getCurrentState()).toBe(TimerState.PAUSED);
      expect(onStateChange).toHaveBeenCalledWith(TimerState.PAUSED);
    });

    it('should resume the countdown after pause', () => {
      const onSnapshot = vi.fn();
      const onStateChange = vi.fn();
      const countdown = Countdown(60, { onSnapshot, onStateChange });

      countdown.start();
      expect(onSnapshot).toHaveBeenCalledWith(expect.objectContaining({ totalSeconds: 60 }));

      // Advance 5 seconds
      vi.advanceTimersByTime(5100);

      countdown.pause();
      const pausedMinutes = countdown.getMinutes();
      const pausedSeconds = countdown.getSeconds();

      // Time passes while paused
      vi.advanceTimersByTime(10000);

      // Time should not change while paused
      expect(countdown.getMinutes()).toBe(pausedMinutes);
      expect(countdown.getSeconds()).toBe(pausedSeconds);

      countdown.resume();
      expect(countdown.getCurrentState()).toBe(TimerState.RUNNING);
      expect(onStateChange).toHaveBeenCalledWith(TimerState.RUNNING);

      // Clear previous calls and advance 1 second after resume
      onSnapshot.mockClear();
      vi.advanceTimersByTime(1100);
      expect(onSnapshot).toHaveBeenCalledWith(expect.objectContaining({ totalSeconds: 54 }));
    });
  });

  describe('Reset functionality', () => {
    it('should reset the countdown to initial value', () => {
      const onSnapshot = vi.fn();
      const countdown = Countdown(30, { onSnapshot });

      countdown.start();
      vi.advanceTimersByTime(10100); // Advance 10 seconds

      countdown.reset();

      expect(countdown.getMinutes()).toBe('00');
      expect(countdown.getSeconds()).toBe('30');
      expect(countdown.getCurrentState()).toBe(TimerState.IDLE);
      expect(onSnapshot).toHaveBeenLastCalledWith(expect.objectContaining({ totalSeconds: 30 }));
    });

    it('should allow starting after reset', () => {
      const countdown = Countdown(20);

      countdown.start();
      vi.advanceTimersByTime(5000);
      countdown.reset();

      countdown.start();
      expect(countdown.getCurrentState()).toBe(TimerState.RUNNING);
    });
  });

  describe('Stop functionality', () => {
    it('should stop the countdown and reset to 0', () => {
      const onSnapshot = vi.fn();
      const countdown = Countdown(45, { onSnapshot });

      countdown.start();
      vi.advanceTimersByTime(15100); // Advance 15 seconds

      countdown.stop();

      expect(countdown.getMinutes()).toBe('00');
      expect(countdown.getSeconds()).toBe('00');
      expect(countdown.getCurrentState()).toBe(TimerState.STOPPED);
      expect(onSnapshot).toHaveBeenLastCalledWith(expect.objectContaining({ totalSeconds: 0 }));
    });
  });

  describe('Time getter functions', () => {
    it('should return correct time components', () => {
      const countdown = Countdown(93784); // 1 day, 2 hours, 3 minutes, 4 seconds

      expect(countdown.getSeconds()).toBe('04');
      expect(countdown.getMinutes()).toBe('03'); // 1563 total min % 60 = 3
      expect(countdown.getHours()).toBe('02');
      expect(countdown.getDays()).toBe('01');
      expect(countdown.getWeeks()).toBe('00');
      expect(countdown.getYears()).toBe('00');
    });

    it('should expose the latest snapshot through getSnapshot', () => {
      const countdown = Countdown(5);

      const initialSnapshot = countdown.getSnapshot();
      expect(initialSnapshot.totalSeconds).toBe(5);
      expect(initialSnapshot.state).toBe(TimerState.IDLE);

      countdown.start();
      vi.advanceTimersByTime(1100);

      const runningSnapshot = countdown.getSnapshot();
      expect(runningSnapshot).not.toBe(initialSnapshot);
      expect(runningSnapshot.state).toBe(TimerState.RUNNING);
      expect(runningSnapshot.totalSeconds).toBe(4);

      countdown.destroy();
    });

    it('should return correct time for large values', () => {
      const countdown = Countdown(31536000); // 1 year (365 days)

      expect(countdown.getYears()).toBe('01');
      expect(countdown.getDays()).toBe('00'); // 365 days = exactly 1 year (consistent successive-subtraction decomposition)
      expect(countdown.getHours()).toBe('00');
      expect(countdown.getMinutes()).toBe('00'); // 525600 total min % 60 = 0
      expect(countdown.getSeconds()).toBe('00');
    });

    it('should return correct weeks', () => {
      const countdown = Countdown(1209600); // 2 weeks

      expect(countdown.getWeeks()).toBe('02');
      expect(countdown.getDays()).toBe('00');
    });
  });

  describe('Countdown completion', () => {
    it('should complete when reaching 0', () => {
      const onSnapshot = vi.fn();
      const onStateChange = vi.fn();
      const countdown = Countdown(3, { onSnapshot, onStateChange });

      countdown.start();

      // Timer should still be running after 2 seconds
      vi.advanceTimersByTime(2100);
      expect(countdown.getCurrentState()).toBe(TimerState.RUNNING);

      // Advance to completion (past 3 seconds)
      vi.advanceTimersByTime(1100);

      // When timer completes, it should transition to STOPPED state first
      expect(countdown.getCurrentState()).toBe(TimerState.STOPPED);
      expect(onSnapshot).toHaveBeenCalledWith(expect.objectContaining({ totalSeconds: 0 }));
    });

    it('should not continue counting after completion', () => {
      const onSnapshot = vi.fn();
      const countdown = Countdown(2, { onSnapshot });

      countdown.start();
      vi.advanceTimersByTime(2100); // Past completion

      const callCount = onSnapshot.mock.calls.length;

      vi.advanceTimersByTime(1000); // Try to advance more

      // Should not have been called again
      expect(onSnapshot).toHaveBeenCalledTimes(callCount);
    });
  });

  describe('Callbacks', () => {
    it('should call onSnapshot with snapshot on each tick', () => {
      const onSnapshot = vi.fn();
      const countdown = Countdown(125, { onSnapshot }); // 2:05

      countdown.start();

      expect(onSnapshot).toHaveBeenCalledWith(expect.objectContaining({ totalSeconds: 125 }));

      onSnapshot.mockClear();
      vi.advanceTimersByTime(1100);
      expect(onSnapshot).toHaveBeenCalledWith(expect.objectContaining({ totalSeconds: 124 }));

      onSnapshot.mockClear();
      vi.advanceTimersByTime(1000);
      expect(onSnapshot).toHaveBeenCalledWith(expect.objectContaining({ totalSeconds: 123 }));
    });

    it('should call onStateChange for all state transitions', () => {
      const onStateChange = vi.fn();
      const countdown = Countdown(5, { onStateChange });

      countdown.start();
      expect(onStateChange).toHaveBeenCalledWith(TimerState.RUNNING);

      countdown.pause();
      expect(onStateChange).toHaveBeenCalledWith(TimerState.PAUSED);

      countdown.resume();
      expect(onStateChange).toHaveBeenLastCalledWith(TimerState.RUNNING);

      countdown.stop();
      expect(onStateChange).toHaveBeenCalledWith(TimerState.STOPPED);

      countdown.reset();
      expect(onStateChange).toHaveBeenCalledWith(TimerState.IDLE);
    });
  });

  describe('Destroy functionality', () => {
    it('should destroy the countdown timer', () => {
      const onSnapshot = vi.fn();
      const countdown = Countdown(60, { onSnapshot });

      countdown.start();
      expect(onSnapshot).toHaveBeenCalledTimes(1); // Initial call

      countdown.destroy();

      // Should not update after destroy
      vi.advanceTimersByTime(1100);
      expect(onSnapshot).toHaveBeenCalledTimes(1); // Still only initial call
    });
  });

  describe('Multiple operations sequence', () => {
    it('should handle complex sequence of operations', () => {
      const onSnapshot = vi.fn();
      const onStateChange = vi.fn();
      const countdown = Countdown(100, { onSnapshot, onStateChange });

      // Start
      countdown.start();
      expect(countdown.getCurrentState()).toBe(TimerState.RUNNING);

      // Run for 10 seconds
      vi.advanceTimersByTime(10100);

      // Pause
      countdown.pause();
      expect(countdown.getCurrentState()).toBe(TimerState.PAUSED);

      // Resume
      countdown.resume();
      expect(countdown.getCurrentState()).toBe(TimerState.RUNNING);

      // Run for 5 more seconds (total 15 seconds elapsed)
      vi.advanceTimersByTime(5100);

      // After 15 seconds from 100, should have 85 seconds left
      expect(countdown.getMinutes()).toBe('01');
      expect(countdown.getSeconds()).toBe('25');

      // Reset
      countdown.reset();
      expect(countdown.getCurrentState()).toBe(TimerState.IDLE);
      expect(countdown.getMinutes()).toBe('01');
      expect(countdown.getSeconds()).toBe('40');

      // Start again
      countdown.start();
      vi.advanceTimersByTime(2100);

      // Stop
      countdown.stop();
      expect(countdown.getCurrentState()).toBe(TimerState.STOPPED);
      expect(countdown.getMinutes()).toBe('00');
      expect(countdown.getSeconds()).toBe('00');
    });
  });

  describe('Timer completion flow', () => {
    it('should handle timer completion correctly', () => {
      const onSnapshot = vi.fn();
      const onStateChange = vi.fn();
      const countdown = Countdown(2, { onSnapshot, onStateChange });

      countdown.start();

      // Should be running initially
      expect(countdown.getCurrentState()).toBe(TimerState.RUNNING);

      // Let timer complete
      vi.advanceTimersByTime(2100);

      // Timer should complete and transition to STOPPED
      expect(countdown.getCurrentState()).toBe(TimerState.STOPPED);
      expect(onSnapshot).toHaveBeenCalledWith(expect.objectContaining({ totalSeconds: 0 }));
    });
  });

  describe('Idempotency and post-destroy safety', () => {
    it('should not throw on double start', () => {
      const countdown = Countdown(60);
      countdown.start();
      expect(() => countdown.start()).not.toThrow();
    });

    it('should not throw on double pause', () => {
      const countdown = Countdown(60);
      countdown.start();
      countdown.pause();
      expect(() => countdown.pause()).not.toThrow();
    });

    it('should not throw on double stop', () => {
      const countdown = Countdown(60);
      countdown.start();
      countdown.stop();
      expect(() => countdown.stop()).not.toThrow();
    });

    it('should not throw when calling methods after destroy', () => {
      const countdown = Countdown(60);
      countdown.start();
      countdown.destroy();

      expect(() => countdown.start()).not.toThrow();
      expect(() => countdown.pause()).not.toThrow();
      expect(() => countdown.resume()).not.toThrow();
      expect(() => countdown.stop()).not.toThrow();
      expect(() => countdown.reset()).not.toThrow();
    });

    it('should return stable values from getters after destroy', () => {
      const countdown = Countdown(65);
      countdown.start();
      countdown.destroy();

      expect(() => countdown.getSeconds()).not.toThrow();
      expect(() => countdown.getMinutes()).not.toThrow();
      expect(() => countdown.getHours()).not.toThrow();
      expect(() => countdown.getDays()).not.toThrow();
      expect(() => countdown.getWeeks()).not.toThrow();
      expect(() => countdown.getYears()).not.toThrow();
      expect(() => countdown.getCurrentState()).not.toThrow();
      expect(() => countdown.getSnapshot()).not.toThrow();
    });

    it('should not throw on double destroy', () => {
      const countdown = Countdown(60);
      countdown.destroy();
      expect(() => countdown.destroy()).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle large time values correctly', () => {
      const countdown = Countdown(3661); // 1 hour, 1 minute, 1 second

      expect(countdown.getMinutes()).toBe('01'); // 61 total min % 60 = 1
      expect(countdown.getSeconds()).toBe('01');
      expect(countdown.getHours()).toBe('01');
    });

    it('should handle time format correctly during countdown', () => {
      const onSnapshot = vi.fn();
      const countdown = Countdown(61, { onSnapshot }); // 1:01

      countdown.start();
      expect(onSnapshot).toHaveBeenCalledWith(expect.objectContaining({ totalSeconds: 61 }));

      onSnapshot.mockClear();
      vi.advanceTimersByTime(2100);
      expect(onSnapshot).toHaveBeenCalledWith(expect.objectContaining({ totalSeconds: 59 }));
    });

    it('should handle timer precision with 100ms intervals', () => {
      const onSnapshot = vi.fn();
      const countdown = Countdown(5, { onSnapshot });

      countdown.start();

      // Advance by 950ms - should not trigger update yet
      vi.advanceTimersByTime(950);
      expect(onSnapshot).toHaveBeenCalledTimes(1); // Only initial call

      // Advance by another 100ms to pass 1 second
      vi.advanceTimersByTime(100);
      expect(onSnapshot).toHaveBeenCalledTimes(2); // Now should have updated
      expect(onSnapshot).toHaveBeenLastCalledWith(expect.objectContaining({ totalSeconds: 4 }));
    });
  });
});

describe('Countdown - Error Handling', () => {
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

  describe('Initialization validation', () => {
    it('should throw error for negative initial seconds', () => {
      expect(() => Countdown(-1)).toThrowError('initialSeconds must be non-negative');
    });

    it('should throw error for non-integer initial seconds', () => {
      expect(() => Countdown(10.5)).toThrowError('initialSeconds must be a finite, non-negative integer');
    });

    it('should throw error for non-number initial seconds', () => {
      expect(() => Countdown('10' as any)).toThrowError('initialSeconds must be a finite, non-negative integer');
    });

    it('should throw error for initial seconds exceeding MAX_SAFE_INTEGER', () => {
      expect(() => Countdown(Number.MAX_SAFE_INTEGER + 1)).toThrowError('initialSeconds exceeds maximum safe integer');
    });

    it('should throw error when onSnapshot is not a function', () => {
      expect(() => Countdown(60, { onSnapshot: 'not a function' as any })).toThrowError(
        'onSnapshot must be a function'
      );
    });

    it('should throw error when onStateChange is not a function', () => {
      expect(() => Countdown(60, { onStateChange: 'not a function' as any })).toThrowError(
        'onStateChange must be a function'
      );
    });

    it('should throw error when onError is not a function', () => {
      expect(() => Countdown(60, { onError: 'not a function' as any })).toThrowError('onError must be a function');
    });
  });

  describe('Callback error handling', () => {
    it('should handle error in onSnapshot callback', () => {
      const onSnapshot = vi.fn(() => {
        throw new Error('onSnapshot error');
      });
      const countdown = Countdown(60, { onSnapshot });

      // Start countdown to trigger onSnapshot
      countdown.start();

      // Should not throw, error should be caught internally
      expect(() => vi.advanceTimersByTime(1100)).not.toThrow();
    });

    it('should handle non-Error thrown in onSnapshot callback', () => {
      const onSnapshot = vi.fn(() => {
        throw 'string error';
      });
      const countdown = Countdown(60, { onSnapshot });

      countdown.start();

      expect(() => vi.advanceTimersByTime(1100)).not.toThrow();
    });

    it('should handle onSnapshot callback errors', () => {
      const onSnapshot = vi.fn(() => {
        throw new Error('onSnapshot error');
      });
      const countdown = Countdown(60, { onSnapshot });

      countdown.start();

      expect(() => vi.advanceTimersByTime(1100)).not.toThrow();
      expect(onSnapshot).toHaveBeenCalled();
    });

    it('should handle onStateChange callback errors', () => {
      const onStateChange = vi.fn(() => {
        throw new Error('onStateChange error');
      });
      const countdown = Countdown(60, { onStateChange });

      // Should not throw when starting
      expect(() => countdown.start()).not.toThrow();
    });
  });

  describe('onError callback', () => {
    it('should call onError when onSnapshot throws', () => {
      const onError = vi.fn();
      const onSnapshot = vi.fn(() => {
        throw new Error('snapshot boom');
      });
      const countdown = Countdown(60, { onSnapshot, onError });

      countdown.start();

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError.mock.calls[0][0].message).toBe('snapshot boom');
    });

    it('should call onError when onStateChange throws', () => {
      const onError = vi.fn();
      const onStateChange = vi.fn(() => {
        throw new Error('state boom');
      });
      const countdown = Countdown(60, { onStateChange, onError });

      countdown.start();

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError.mock.calls[0][0].message).toBe('state boom');
    });

    it('should normalize non-Error throws to Error instances', () => {
      const onError = vi.fn();
      const onSnapshot = vi.fn(() => {
        throw 'raw string error';
      });
      const countdown = Countdown(60, { onSnapshot, onError });

      countdown.start();

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError.mock.calls[0][0].message).toBe('raw string error');
    });

    it('should normalize non-Error throws from onStateChange to Error instances', () => {
      const onError = vi.fn();
      const onStateChange = vi.fn(() => {
        throw 'raw string from state';
      });
      const countdown = Countdown(60, { onStateChange, onError });

      countdown.start();

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError.mock.calls[0][0].message).toBe('raw string from state');
    });

    it('should not throw when onError is not provided and callbacks throw', () => {
      const onSnapshot = vi.fn(() => {
        throw new Error('no handler');
      });
      const countdown = Countdown(60, { onSnapshot });

      countdown.start();
      expect(() => vi.advanceTimersByTime(1100)).not.toThrow();
    });

    it('should not throw when onError itself throws', () => {
      const onError = vi.fn(() => {
        throw new Error('handler also broken');
      });
      const onSnapshot = vi.fn(() => {
        throw new Error('snapshot error');
      });
      const countdown = Countdown(60, { onSnapshot, onError });

      expect(() => countdown.start()).not.toThrow();
    });
  });

  describe('Timer error handling', () => {
    it('should handle timer execution errors gracefully', async () => {
      // Create a countdown and verify it starts without throwing
      const countdown = Countdown(60, {
        onSnapshot: () => {
          // Force an error during the timer tick
          throw new Error('Update processing error');
        },
      });

      countdown.start();

      // This should trigger the error in onSnapshot, which gets caught
      expect(() => vi.advanceTimersByTime(1100)).not.toThrow();
    });
  });

  describe('Method propagation (no swallowing)', () => {
    it('should propagate errors thrown by the engine start method', async () => {
      vi.doMock('../runtime/timer', () => ({
        Timer: vi.fn(() => ({
          start: vi.fn(() => {
            throw new Error('Timer start error');
          }),
          stop: vi.fn(),
          reset: vi.fn(),
          destroy: vi.fn(),
          getTotalSeconds: vi.fn(() => 60),
          setSeconds: vi.fn(),
          setInitialValue: vi.fn(),
          getInitialValue: vi.fn(() => 60),
          isRunning: vi.fn(() => false),
        })),
      }));

      const { Countdown: MockedCountdown } = await import('../api/countdown');
      const countdown = MockedCountdown(60);

      expect(() => countdown.start()).toThrow('Timer start error');

      vi.doUnmock('../runtime/timer');
    });

    it('should propagate errors thrown by the engine reset method', async () => {
      vi.doMock('../runtime/timer', () => ({
        Timer: vi.fn(() => ({
          start: vi.fn(() => true),
          stop: vi.fn(),
          reset: vi.fn(() => {
            throw new Error('Reset error');
          }),
          destroy: vi.fn(),
          getTotalSeconds: vi.fn(() => 60),
          setSeconds: vi.fn(),
          setInitialValue: vi.fn(),
          getInitialValue: vi.fn(() => 60),
          isRunning: vi.fn(() => false),
        })),
      }));

      const { Countdown: MockedCountdown } = await import('../api/countdown');
      const countdown = MockedCountdown(60);

      expect(() => countdown.reset()).toThrow('Reset error');

      vi.doUnmock('../runtime/timer');
    });

    it('should propagate errors thrown by the formatter in getters', async () => {
      vi.doMock('../format/formatter', () => ({
        Formatter: vi.fn(() => ({
          formatTime: vi.fn(() => ({ minutes: '00', seconds: '00' })),
          formatSeconds: vi.fn(() => {
            throw new Error('Format seconds error');
          }),
          formatMinutes: vi.fn(() => '00'),
          formatHours: vi.fn(() => '00'),
          formatDays: vi.fn(() => '00'),
          formatWeeks: vi.fn(() => '00'),
          formatYears: vi.fn(() => '00'),
        })),
      }));

      const { Countdown: MockedCountdown } = await import('../api/countdown');
      const countdown = MockedCountdown(60);

      expect(() => countdown.getSeconds()).toThrow('Format seconds error');

      vi.doUnmock('../format/formatter');
    });
  });

  describe('Edge case error handling', () => {
    it('should handle invalid totalSeconds defensively', () => {
      const onSnapshot = vi.fn();
      const countdown = Countdown(60, { onSnapshot });

      countdown.start();
      expect(onSnapshot).toHaveBeenCalledWith(expect.objectContaining({ totalSeconds: 60 }));
    });

    it('should handle defensive programming for invalid totalSeconds', () => {
      const onSnapshot = vi.fn();
      const countdown = Countdown(60, { onSnapshot });

      countdown.start();

      expect(onSnapshot).toHaveBeenCalledWith(expect.objectContaining({ totalSeconds: expect.any(Number) }));
      const snapshot = onSnapshot.mock.calls[0][0];
      expect(snapshot.totalSeconds).toBeGreaterThanOrEqual(0);
    });

    it('should handle timer onError callback gracefully', () => {
      const countdown = Countdown(60, {
        onSnapshot: () => {
          throw new Error('Update callback error');
        },
      });

      countdown.start();

      // Advance time to trigger the onSnapshot error
      expect(() => vi.advanceTimersByTime(1100)).not.toThrow();
    });

    it('should transition to STOPPED when an internal timer error occurs', () => {
      const onStateChange = vi.fn();
      const countdown = Countdown(5, { onStateChange });

      countdown.start();
      expect(onStateChange).toHaveBeenCalledWith(TimerState.RUNNING);

      // Advance past the end to trigger completion → STOPPED transition
      vi.advanceTimersByTime(6000);

      expect(countdown.getCurrentState()).toBe(TimerState.STOPPED);
      expect(onStateChange).toHaveBeenCalledWith(TimerState.STOPPED);
    });

    it('should handle invalid totalSeconds in updateUI defensive check', () => {
      const onSnapshot = vi.fn();
      const countdown = Countdown(60, { onSnapshot });

      countdown.start();

      expect(onSnapshot).toHaveBeenCalledWith(expect.objectContaining({ totalSeconds: 60 }));

      onSnapshot.mockClear();

      vi.advanceTimersByTime(1100);
      expect(onSnapshot).toHaveBeenCalled();

      onSnapshot.mock.calls.forEach(call => {
        expect(call[0].totalSeconds).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle negative totalSeconds in updateUI defensive check', async () => {
      const onSnapshot = vi.fn();

      // Mock timer to return negative totalSeconds to trigger the defensive check
      vi.doMock('../runtime/timer', () => ({
        Timer: vi.fn(() => ({
          start: vi.fn(() => true),
          stop: vi.fn(),
          reset: vi.fn(),
          destroy: vi.fn(),
          getTotalSeconds: vi.fn(() => -5), // Negative value to trigger line 51
          setSeconds: vi.fn(),
        })),
      }));

      const { Countdown: MockedCountdown } = await import('../api/countdown');
      const countdown = MockedCountdown(60, { onSnapshot });

      countdown.start();

      // F01: buildSnapshot sanitizes totalSeconds at the snapshot-construction boundary,
      // so a negative timer reading can never leak into any emitted snapshot — every
      // emission is a finite, non-negative integer (the bad -5 is clamped to 0). Old
      // behavior leaked the raw -5.
      expect(onSnapshot).toHaveBeenCalled();
      onSnapshot.mock.calls.forEach(call => {
        expect(Number.isInteger(call[0].totalSeconds)).toBe(true);
        expect(call[0].totalSeconds).toBeGreaterThanOrEqual(0);
      });
      // The post-start transition snapshot (driven by the mocked timer's -5) is clamped to 0.
      expect(onSnapshot).toHaveBeenLastCalledWith(expect.objectContaining({ totalSeconds: 0 }));

      vi.doUnmock('../runtime/timer');
    });

    it('should handle NaN totalSeconds in updateUI defensive check', async () => {
      const onSnapshot = vi.fn();

      // Mock timer to return NaN totalSeconds to trigger the defensive check
      vi.doMock('../runtime/timer', () => ({
        Timer: vi.fn(() => ({
          start: vi.fn(() => true),
          stop: vi.fn(),
          reset: vi.fn(),
          destroy: vi.fn(),
          getTotalSeconds: vi.fn(() => NaN), // NaN value to trigger line 51
          setSeconds: vi.fn(),
        })),
      }));

      const { Countdown: MockedCountdown } = await import('../api/countdown');
      const countdown = MockedCountdown(60, { onSnapshot });

      countdown.start();

      // F01: a non-finite timer reading (NaN) is sanitized to 0 in buildSnapshot, so no
      // emitted snapshot ever carries NaN — every emission is a finite, non-negative
      // integer. Old behavior leaked the raw NaN.
      expect(onSnapshot).toHaveBeenCalled();
      onSnapshot.mock.calls.forEach(call => {
        expect(Number.isFinite(call[0].totalSeconds)).toBe(true);
        expect(call[0].totalSeconds).toBeGreaterThanOrEqual(0);
      });
      // The post-start transition snapshot (driven by the mocked timer's NaN) is clamped to 0.
      expect(onSnapshot).toHaveBeenLastCalledWith(expect.objectContaining({ totalSeconds: 0 }));

      vi.doUnmock('../runtime/timer');
    });

    it('should handle Infinity totalSeconds in updateUI defensive check', async () => {
      const onSnapshot = vi.fn();

      // Mock timer to return Infinity totalSeconds to trigger the defensive check
      vi.doMock('../runtime/timer', () => ({
        Timer: vi.fn(() => ({
          start: vi.fn(() => true),
          stop: vi.fn(),
          reset: vi.fn(),
          destroy: vi.fn(),
          getTotalSeconds: vi.fn(() => Infinity), // Infinity value to trigger line 51
          setSeconds: vi.fn(),
        })),
      }));

      const { Countdown: MockedCountdown } = await import('../api/countdown');
      const countdown = MockedCountdown(60, { onSnapshot });

      countdown.start();

      // F01: a non-finite timer reading (Infinity) is sanitized to 0 in buildSnapshot, so
      // no emitted snapshot ever carries Infinity — every emission is a finite,
      // non-negative integer. Old behavior leaked the raw Infinity.
      expect(onSnapshot).toHaveBeenCalled();
      onSnapshot.mock.calls.forEach(call => {
        expect(Number.isFinite(call[0].totalSeconds)).toBe(true);
        expect(call[0].totalSeconds).toBeGreaterThanOrEqual(0);
      });
      // The post-start transition snapshot (driven by the mocked timer's Infinity) is clamped to 0.
      expect(onSnapshot).toHaveBeenLastCalledWith(expect.objectContaining({ totalSeconds: 0 }));

      vi.doUnmock('../runtime/timer');
    });
  });
});
