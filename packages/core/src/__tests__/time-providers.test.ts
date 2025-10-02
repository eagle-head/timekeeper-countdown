import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCurrentTime, isHighResolutionTimeAvailable, getTimeProviderInfo } from '../runtime/time-providers';

describe('time-providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  describe('getCurrentTime', () => {
    it('should return a valid number', () => {
      const time = getCurrentTime();

      expect(typeof time).toBe('number');
      expect(Number.isFinite(time)).toBe(true);
      expect(time).toBeGreaterThanOrEqual(0);
    });

    it('should return consistent increasing values', () => {
      const time1 = getCurrentTime();
      const time2 = getCurrentTime();

      expect(time2).toBeGreaterThanOrEqual(time1);
    });

    it('should work with performance.now() available', async () => {
      const mockPerformanceNow = vi.fn(() => 1234.567);
      vi.stubGlobal('performance', {
        now: mockPerformanceNow,
      });

      // Need to reimport to get fresh instance
      vi.resetModules();
      const { getCurrentTime: freshGetCurrentTime } = await import('../runtime/time-providers');

      const time = freshGetCurrentTime();
      expect(time).toBe(1234.567);
    });
  });

  describe('isHighResolutionTimeAvailable', () => {
    it('should return a boolean', () => {
      const isHighRes = isHighResolutionTimeAvailable();
      expect(typeof isHighRes).toBe('boolean');
    });

    it('should return true when performance.now() is available and working', async () => {
      const mockPerformanceNow = vi.fn(() => 1234.567);
      vi.stubGlobal('performance', {
        now: mockPerformanceNow,
      });

      vi.resetModules();

      const { isHighResolutionTimeAvailable: freshIsHighRes } = await import('../runtime/time-providers');
      expect(freshIsHighRes()).toBe(true);
    });

    it('should return false when performance.now() is not available', async () => {
      vi.stubGlobal('performance', undefined);

      vi.resetModules();

      const { isHighResolutionTimeAvailable: freshIsHighRes } = await import('../runtime/time-providers');
      expect(freshIsHighRes()).toBe(false);
    });
  });

  describe('getTimeProviderInfo', () => {
    it('should return an object with type and isHighResolution properties', () => {
      const info = getTimeProviderInfo();

      expect(typeof info).toBe('object');
      expect(info).toHaveProperty('type');
      expect(info).toHaveProperty('isHighResolution');
      expect(typeof info.type).toBe('string');
      expect(typeof info.isHighResolution).toBe('boolean');
    });

    it('should return performance type when performance.now() is available', async () => {
      const mockPerformanceNow = vi.fn(() => 1234.567);
      vi.stubGlobal('performance', {
        now: mockPerformanceNow,
      });

      vi.resetModules();

      const { getTimeProviderInfo: freshGetInfo } = await import('../runtime/time-providers');
      const info = freshGetInfo();
      expect(info.type).toBe('performance');
      expect(info.isHighResolution).toBe(true);
    });

    it('should return date type when performance.now() is not available', async () => {
      vi.stubGlobal('performance', undefined);

      vi.resetModules();

      const { getTimeProviderInfo: freshGetInfo } = await import('../runtime/time-providers');
      const info = freshGetInfo();
      expect(info.type).toBe('date');
      expect(info.isHighResolution).toBe(false);
    });

    it('should have consistent values between type and isHighResolution', () => {
      const info = getTimeProviderInfo();

      if (info.type === 'performance') {
        expect(info.isHighResolution).toBe(true);
      } else if (info.type === 'date') {
        expect(info.isHighResolution).toBe(false);
      }
    });
  });

  describe('time provider behavior', () => {
    it('should maintain time progression over multiple calls', () => {
      const times: number[] = [];

      for (let i = 0; i < 5; i++) {
        times.push(getCurrentTime());
      }

      for (let i = 1; i < times.length; i++) {
        expect(times[i]).toBeGreaterThanOrEqual(times[i - 1]);
      }
    });

    it('should return reasonable timestamp values', () => {
      const time = getCurrentTime();
      const now = Date.now();

      // Time should be within reasonable bounds (accounting for performance.now vs Date.now differences)
      expect(time).toBeGreaterThan(0);
      expect(time).toBeLessThan(now + 10000); // Allow some buffer for performance timing
    });
  });

  describe('error handling and fallbacks', () => {
    it('should handle when provider returns invalid values', async () => {
      // Mock performance.now to return invalid values
      // Note: performance.now() should return number, but we test error handling
      const mockPerformanceNow = vi
        .fn()
        .mockReturnValueOnce(NaN)
        .mockReturnValueOnce(-Infinity)
        .mockReturnValueOnce(Infinity)
        .mockReturnValueOnce(0) // Use 0 instead of string
        .mockReturnValueOnce(-1) // Use -1 instead of null
        .mockReturnValueOnce(0); // Use 0 instead of undefined

      vi.stubGlobal('performance', {
        now: mockPerformanceNow,
      });

      vi.resetModules();
      const { getCurrentTime: freshGetCurrentTime } = await import('../runtime/time-providers');

      // Should fallback to Date.now() for each invalid value
      const time1 = freshGetCurrentTime();
      expect(typeof time1).toBe('number');
      expect(time1).toBeGreaterThan(0);

      const time2 = freshGetCurrentTime();
      expect(typeof time2).toBe('number');
      expect(time2).toBeGreaterThan(0);
    });

    it('should fallback to Date.now() when performance.now() throws', async () => {
      const mockPerformanceNow = vi.fn(() => {
        throw new Error('Performance API error');
      });

      vi.stubGlobal('performance', {
        now: mockPerformanceNow,
      });

      vi.resetModules();
      const { getCurrentTime: freshGetCurrentTime } = await import('../runtime/time-providers');

      const time = freshGetCurrentTime();
      expect(typeof time).toBe('number');
      expect(time).toBeGreaterThan(0);
      expect(time).toBeCloseTo(Date.now(), -2); // Within 100ms
    });

    it('should return 0 as last resort when all providers fail', async () => {
      // Mock both performance.now() and Date.now() to fail
      const mockPerformanceNow = vi.fn(() => {
        throw new Error('Performance API error');
      });

      vi.stubGlobal('performance', {
        now: mockPerformanceNow,
      });

      const mockDateNow = vi.fn(() => {
        throw new Error('Date API error');
      });

      vi.stubGlobal('Date', {
        ...Date,
        now: mockDateNow,
      });

      vi.resetModules();
      const { getCurrentTime: freshGetCurrentTime } = await import('../runtime/time-providers');

      const time = freshGetCurrentTime();
      expect(time).toBe(0);
    });

    it('should handle when fallback provider returns invalid values', async () => {
      // Mock performance to throw, forcing fallback to Date
      const mockPerformanceNow = vi.fn(() => {
        throw new Error('Performance API error');
      });

      vi.stubGlobal('performance', {
        now: mockPerformanceNow,
      });

      // Mock Date.now to return invalid values
      const mockDateNow = vi.fn().mockReturnValueOnce(NaN).mockReturnValueOnce(-1).mockReturnValueOnce(0); // Use 0 instead of undefined since Date.now() must return number

      vi.stubGlobal('Date', {
        ...Date,
        now: mockDateNow,
      });

      vi.resetModules();
      const { getCurrentTime: freshGetCurrentTime } = await import('../runtime/time-providers');

      // Each call should handle the invalid value and return 0
      expect(freshGetCurrentTime()).toBe(0); // NaN fallback
      expect(freshGetCurrentTime()).toBe(0); // -1 fallback
      expect(freshGetCurrentTime()).toBe(0); // 0 should be handled as valid
    });

    it('should switch to fallback provider permanently after failure', async () => {
      let callCount = 0;
      const mockPerformanceNow = vi.fn(() => {
        callCount++;
        if (callCount <= 2) {
          return 1234.567; // First two calls work (one for init, one for first getCurrentTime)
        }
        throw new Error('Performance API error'); // Subsequent calls fail
      });

      vi.stubGlobal('performance', {
        now: mockPerformanceNow,
      });

      vi.resetModules();
      const { getCurrentTime: freshGetCurrentTime, getTimeProviderInfo: freshGetInfo } = await import(
        '../runtime/time-providers'
      );

      // First call should use performance
      const time1 = freshGetCurrentTime();
      expect(time1).toBe(1234.567);

      // Second call should trigger fallback
      const time2 = freshGetCurrentTime();
      expect(typeof time2).toBe('number');
      expect(time2).toBeGreaterThan(0);

      // Provider info should now show date provider
      const info = freshGetInfo();
      expect(info.type).toBe('date');
      expect(info.isHighResolution).toBe(false);
    });

    it('should handle edge case values correctly', async () => {
      let callIndex = 0;
      const mockPerformanceNow = vi.fn(() => {
        callIndex++;
        // First call is for initialization
        if (callIndex === 1) {
          return 100; // Valid init value
        }
        // Subsequent calls for actual tests
        if (callIndex === 2) {
          return 0; // Valid zero
        }
        if (callIndex === 3) {
          return Number.MAX_SAFE_INTEGER; // Max safe integer
        }
        if (callIndex === 4) {
          return Number.MAX_SAFE_INTEGER + 1; // Beyond max safe integer
        }
        return 100; // Default
      });

      vi.stubGlobal('performance', {
        now: mockPerformanceNow,
      });

      vi.resetModules();
      const { getCurrentTime: freshGetCurrentTime } = await import('../runtime/time-providers');

      // Zero should be valid
      expect(freshGetCurrentTime()).toBe(0);

      // MAX_SAFE_INTEGER should be valid
      expect(freshGetCurrentTime()).toBe(Number.MAX_SAFE_INTEGER);

      // Beyond MAX_SAFE_INTEGER should fallback
      const time3 = freshGetCurrentTime();
      expect(time3).not.toBe(Number.MAX_SAFE_INTEGER + 1);
      expect(time3).toBeGreaterThan(0);
    });
  });
});
