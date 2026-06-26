import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { Timer } from '../runtime/timer';

const { now: mockedNow } = vi.hoisted(() => ({
  now: vi.fn<() => number>(() => Date.now()),
})) as { now: Mock<() => number> };

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

describe('Timer - Happy Path', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockedNow.mockReset();
    mockedNow.mockImplementation(() => Date.now());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create a timer with valid initial seconds', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(60, events);

      expect(timer).toBeDefined();
      expect(timer.getTotalSeconds()).toBe(60);
      expect(timer.getInitialValue()).toBe(60);
      expect(timer.isRunning()).toBe(false);
    });

    it('should create a timer with zero seconds', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(0, events);

      expect(timer.getTotalSeconds()).toBe(0);
      expect(timer.isRunning()).toBe(false);
    });

    it('should handle floating point seconds by flooring', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10.9, events);

      expect(timer.getTotalSeconds()).toBe(10);
    });

    it('should validate initialSeconds is a finite number', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      expect(() => Timer(Infinity, events)).toThrow('initialSeconds must be a finite number');
      expect(() => Timer(NaN, events)).toThrow('initialSeconds must be a finite number');
      expect(() => Timer('10' as any, events)).toThrow('initialSeconds must be a finite number');
    });

    it('should validate initialSeconds is non-negative', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      expect(() => Timer(-5, events)).toThrow('initialSeconds must be non-negative');
    });

    it('should validate initialSeconds does not exceed maximum safe integer', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      expect(() => Timer(Number.MAX_SAFE_INTEGER + 1, events)).toThrow('initialSeconds exceeds maximum safe integer');
    });
  });

  describe('Start functionality', () => {
    it('should start the timer successfully', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10, events);
      const started = timer.start();

      expect(started).toBe(true);
      expect(timer.isRunning()).toBe(true);
    });

    it('should not start when already running', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10, events);
      timer.start();
      const startedAgain = timer.start();

      expect(startedAgain).toBe(false);
    });

    it('should not start when totalSeconds is zero', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(0, events);
      const started = timer.start();

      expect(started).toBe(false);
    });

    it('should handle errors during start by calling onError', async () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      // Mock getCurrentTime to throw an error
      const { getCurrentTime } = await import('../runtime/time-providers');
      vi.mocked(getCurrentTime).mockImplementationOnce(() => {
        throw new Error('Time provider error');
      });

      const timer = Timer(10, events);
      const started = timer.start();

      expect(started).toBe(false);
      expect(events.onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle non-Error exceptions during start', async () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      // Mock getCurrentTime to throw a non-Error
      const { getCurrentTime } = await import('../runtime/time-providers');
      vi.mocked(getCurrentTime).mockImplementationOnce(() => {
        throw { message: 'Object error', code: 500 }; // Non-Error exception
      });

      const timer = Timer(10, events);
      const started = timer.start();

      expect(started).toBe(false);
      expect(events.onError).toHaveBeenCalledWith(expect.any(Error));
      expect(events.onError.mock.calls[0][0].message).toBe('[object Object]');
    });
  });

  describe('Timer ticking', () => {
    it('should call onTick when seconds change', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(5, events);
      timer.start();

      vi.advanceTimersByTime(1100);
      expect(events.onTick).toHaveBeenCalledWith(4);

      vi.advanceTimersByTime(1000);
      expect(events.onTick).toHaveBeenCalledWith(3);
    });

    it('should only call onTick when seconds actually change', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(5, events);
      timer.start();

      events.onTick.mockClear();

      vi.advanceTimersByTime(500);
      expect(events.onTick).not.toHaveBeenCalled();

      vi.advanceTimersByTime(600);
      expect(events.onTick).toHaveBeenCalledTimes(1);
    });

    it('should call onComplete when timer reaches zero', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(2, events);
      timer.start();

      vi.advanceTimersByTime(2100);

      expect(events.onComplete).toHaveBeenCalled();
      expect(timer.isRunning()).toBe(false);
    });

    it('should handle errors during timer tick by calling onError and stopping', async () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      // Mock getCurrentTime to throw an error after start
      const { getCurrentTime } = await import('../runtime/time-providers');
      vi.mocked(getCurrentTime)
        .mockReturnValueOnce(1000) // First call for start
        .mockImplementationOnce(() => {
          throw new Error('Time provider error during tick');
        });

      const timer = Timer(5, events);
      timer.start();

      vi.advanceTimersByTime(200); // Trigger the interval

      expect(events.onError).toHaveBeenCalledWith(expect.any(Error));
      expect(timer.isRunning()).toBe(false);
    });

    it('should handle non-Error exceptions during timer tick', async () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      // Mock getCurrentTime to throw a non-Error after start
      const { getCurrentTime } = await import('../runtime/time-providers');
      vi.mocked(getCurrentTime)
        .mockReturnValueOnce(1000) // First call for start
        .mockImplementationOnce(() => {
          throw 'String error instead of Error object'; // Non-Error exception
        });

      const timer = Timer(5, events);
      timer.start();

      vi.advanceTimersByTime(200); // Trigger the interval

      expect(events.onError).toHaveBeenCalledWith(expect.any(Error));
      expect(events.onError.mock.calls[0][0].message).toBe('String error instead of Error object');
      expect(timer.isRunning()).toBe(false);
    });

    it('should skip setInitialValue when provided value is not finite', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(30, events);

      timer.setInitialValue(NaN as unknown as number);

      expect(timer.getInitialValue()).toBe(30);
      expect(timer.getTotalSeconds()).toBe(30);

      timer.setInitialValue(Infinity);

      expect(timer.getInitialValue()).toBe(30);
      expect(timer.getTotalSeconds()).toBe(30);
    });

    it('should sanitize initial value and synchronize total seconds', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10, events);

      timer.setInitialValue(-5);

      expect(timer.getInitialValue()).toBe(0);
      expect(timer.getTotalSeconds()).toBe(0);

      timer.setInitialValue(42.9);

      expect(timer.getInitialValue()).toBe(42);
      expect(timer.getTotalSeconds()).toBe(42);

      const oversizedSeconds = Number.MAX_SAFE_INTEGER + 1000;

      timer.setInitialValue(oversizedSeconds);

      expect(timer.getInitialValue()).toBe(Number.MAX_SAFE_INTEGER);
      expect(timer.getTotalSeconds()).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should return early when startTimestamp is null during tick', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10, events);
      timer.start();

      // Clear the onTick mock to isolate this test
      events.onTick.mockClear();

      // Stop the timer to set startTimestamp to null, but interval might still fire
      timer.stop();

      // Force a tick when startTimestamp is null
      vi.advanceTimersByTime(200);

      // onTick should not be called because startTimestamp is null
      expect(events.onTick).not.toHaveBeenCalled();
    });

    it('should handle reset while timer is running and reset startTimestamp', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10, events);
      timer.start();

      // Clear the onTick mock to isolate this test
      events.onTick.mockClear();

      // Reset while running - this calls stop() and sets startTimestamp to null
      timer.reset();

      // Any remaining interval ticks should return early
      vi.advanceTimersByTime(200);

      // onTick should not be called because startTimestamp was reset to null
      expect(events.onTick).not.toHaveBeenCalled();
      expect(timer.getTotalSeconds()).toBe(10); // Should be reset to initial value
    });

    it('should handle destroy while timer is running and clear state', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10, events);
      timer.start();

      // Clear the onTick mock to isolate this test
      events.onTick.mockClear();

      // Destroy while running - this calls stop() and clears all state
      timer.destroy();

      // Any remaining interval ticks should return early
      vi.advanceTimersByTime(200);

      // onTick should not be called because timer was destroyed
      expect(events.onTick).not.toHaveBeenCalled();
      expect(timer.getTotalSeconds()).toBe(0); // Should be 0 after destroy
      expect(timer.isRunning()).toBe(false);
    });

    it('should handle setSeconds called while timer is running - covers line 51 early return', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10, events);
      timer.start();

      // Verify timer is running and clear previous onTick calls
      expect(timer.isRunning()).toBe(true);
      events.onTick.mockClear();

      // Call setSeconds while timer is running - this sets startTimestamp = null
      // but does NOT stop the interval (intervalId still exists)
      timer.setSeconds(5);

      // The timer is still "running" (intervalId exists) but startTimestamp is null
      expect(timer.isRunning()).toBe(true);
      expect(timer.getTotalSeconds()).toBe(5);

      // Force the interval to execute multiple times - it should hit the early return on line 51
      // Since startTimestamp is null, all interval ticks should return early
      vi.advanceTimersByTime(500); // Multiple interval executions

      // Since startTimestamp is null, the interval should return early every time
      // and never call onTick
      expect(events.onTick).not.toHaveBeenCalled();
    });

    it('should handle timer precision correctly', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(3, events);
      timer.start();

      vi.advanceTimersByTime(1100);
      expect(events.onTick).toHaveBeenCalledWith(2);

      vi.advanceTimersByTime(1000);
      expect(events.onTick).toHaveBeenCalledWith(1);

      vi.advanceTimersByTime(1000);
      expect(events.onTick).toHaveBeenCalledWith(0);
      expect(events.onComplete).toHaveBeenCalled();
    });
  });

  describe('Stop functionality', () => {
    it('should stop the timer', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10, events);
      timer.start();

      expect(timer.isRunning()).toBe(true);

      timer.stop();

      expect(timer.isRunning()).toBe(false);
    });

    it('should stop calling onTick after stop', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10, events);
      timer.start();

      vi.advanceTimersByTime(1100);
      const tickCount = events.onTick.mock.calls.length;

      timer.stop();
      vi.advanceTimersByTime(1000);

      expect(events.onTick).toHaveBeenCalledTimes(tickCount);
    });
  });

  describe('Reset functionality', () => {
    it('should reset timer to initial value', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10, events);
      timer.start();

      vi.advanceTimersByTime(3100);
      expect(timer.getTotalSeconds()).toBe(7);

      timer.reset();

      expect(timer.getTotalSeconds()).toBe(10);
      expect(timer.isRunning()).toBe(false);
    });

    it('should allow starting after reset', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(5, events);
      timer.start();
      vi.advanceTimersByTime(2100);
      timer.reset();

      const started = timer.start();

      expect(started).toBe(true);
      expect(timer.isRunning()).toBe(true);
      expect(timer.getTotalSeconds()).toBe(5);
    });
  });

  describe('setSeconds functionality', () => {
    it('should update timer seconds', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10, events);
      timer.setSeconds(20);

      expect(timer.getTotalSeconds()).toBe(20);
    });

    it('should handle negative values safely', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10, events);
      timer.setSeconds(-5);

      expect(timer.getTotalSeconds()).toBe(0);
    });

    it('should handle non-number values safely', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10, events);
      const originalSeconds = timer.getTotalSeconds();

      timer.setSeconds('invalid' as any);

      expect(timer.getTotalSeconds()).toBe(originalSeconds);
    });

    it('should floor decimal values', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10, events);
      timer.setSeconds(15.7);

      expect(timer.getTotalSeconds()).toBe(15);
    });

    it('should update timer seconds when stopped', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10, events);
      timer.setSeconds(15);

      expect(timer.getTotalSeconds()).toBe(15);
    });
  });

  describe('Destroy functionality', () => {
    it('should destroy the timer', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10, events);
      timer.start();

      timer.destroy();

      expect(timer.isRunning()).toBe(false);
      expect(timer.getTotalSeconds()).toBe(0);
    });

    it('should stop calling callbacks after destroy', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(5, events);
      timer.start();

      vi.advanceTimersByTime(1100);
      const tickCount = events.onTick.mock.calls.length;

      timer.destroy();
      vi.advanceTimersByTime(5000);

      expect(events.onTick).toHaveBeenCalledTimes(tickCount);
    });
  });

  describe('Resume functionality', () => {
    it('should resume from pause correctly', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10, events);
      timer.start();

      vi.advanceTimersByTime(3100);
      expect(timer.getTotalSeconds()).toBe(7);

      timer.stop();
      vi.advanceTimersByTime(2000);

      timer.start();
      vi.advanceTimersByTime(1100);

      expect(timer.getTotalSeconds()).toBe(6);
    });

    it('should maintain correct timing when resuming', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10, events);
      timer.start();

      vi.advanceTimersByTime(2100);
      timer.stop();

      const remainingBeforePause = timer.getTotalSeconds();

      vi.advanceTimersByTime(5000);

      timer.start();
      expect(timer.getTotalSeconds()).toBe(remainingBeforePause);
    });
  });

  describe('Large values', () => {
    it('should handle large second values', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const largeValue = 86400;
      const timer = Timer(largeValue, events);

      expect(timer.getTotalSeconds()).toBe(largeValue);
      expect(timer.getInitialValue()).toBe(largeValue);
    });

    it('should work correctly with large values during countdown', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(3600, events);
      timer.start();

      vi.advanceTimersByTime(60100);

      expect(timer.getTotalSeconds()).toBe(3540);
      expect(events.onTick).toHaveBeenCalledWith(3540);
    });
  });

  describe('Edge cases', () => {
    it('should complete timer immediately when starting with 0 seconds', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(1, events);
      timer.setSeconds(0);

      const started = timer.start();

      expect(started).toBe(false);
    });

    it('should handle multiple start/stop cycles', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10, events);

      timer.start();
      timer.stop();
      timer.start();
      timer.stop();
      timer.start();

      expect(timer.isRunning()).toBe(true);
    });

    it('should handle reset while running', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10, events);
      timer.start();

      vi.advanceTimersByTime(3100);
      timer.reset();

      expect(timer.isRunning()).toBe(false);
      expect(timer.getTotalSeconds()).toBe(10);
    });

    it('should handle multiple resets', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(15, events);
      timer.start();
      vi.advanceTimersByTime(5100);

      timer.reset();
      timer.reset();
      timer.reset();

      expect(timer.getTotalSeconds()).toBe(15);
    });
  });

  describe('Timer completion', () => {
    it('should complete exactly at zero', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(3, events);
      timer.start();

      vi.advanceTimersByTime(3100);

      expect(timer.getTotalSeconds()).toBe(0);
      expect(events.onTick).toHaveBeenLastCalledWith(0);
      expect(events.onComplete).toHaveBeenCalled();
      expect(timer.isRunning()).toBe(false);
    });

    it('should not call onTick after completion', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(2, events);
      timer.start();

      vi.advanceTimersByTime(2100);
      const tickCount = events.onTick.mock.calls.length;

      vi.advanceTimersByTime(1000);

      expect(events.onTick).toHaveBeenCalledTimes(tickCount);
    });

    it('should allow restart after completion', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(2, events);
      timer.start();

      vi.advanceTimersByTime(2100);
      expect(events.onComplete).toHaveBeenCalled();

      timer.reset();
      const started = timer.start();

      expect(started).toBe(true);
      expect(timer.isRunning()).toBe(true);
    });
  });

  describe('Timing accuracy', () => {
    it('should maintain accuracy over multiple ticks', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10, events);
      timer.start();

      for (let i = 9; i >= 0; i--) {
        vi.advanceTimersByTime(1000);
        if (i > 0) {
          expect(events.onTick).toHaveBeenLastCalledWith(i);
        }
      }

      expect(events.onComplete).toHaveBeenCalled();
    });

    it('should use 100ms intervals for checking', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(5, events);
      timer.start();

      vi.advanceTimersByTime(999);
      expect(events.onTick).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(events.onTick).toHaveBeenCalledWith(4);
    });
  });

  describe('State management', () => {
    it('should track running state correctly', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const timer = Timer(10, events);

      expect(timer.isRunning()).toBe(false);

      timer.start();
      expect(timer.isRunning()).toBe(true);

      timer.stop();
      expect(timer.isRunning()).toBe(false);

      timer.start();
      expect(timer.isRunning()).toBe(true);

      timer.reset();
      expect(timer.isRunning()).toBe(false);
    });

    it('should preserve initial value through operations', () => {
      const events = {
        onTick: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const initialValue = 25;
      const timer = Timer(initialValue, events);

      timer.start();
      vi.advanceTimersByTime(5100);
      timer.stop();
      timer.start();
      timer.reset();
      timer.setSeconds(50);

      expect(timer.getInitialValue()).toBe(initialValue);
    });
  });
});
