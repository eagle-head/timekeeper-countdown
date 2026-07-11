/**
 * Time providers with fallbacks for critical APIs
 * Ensures the library works even without modern browser APIs
 */

export interface TimeProvider {
  now(): number;
  isHighResolution: boolean;
  type: string;
}

function createPerformanceTimeProvider(): TimeProvider {
  return {
    now: () => performance.now(),
    isHighResolution: true,
    type: 'performance',
  };
}

function createDateTimeProvider(): TimeProvider {
  return {
    now: () => Date.now(),
    isHighResolution: false,
    type: 'date',
  };
}

/**
 * True only for a usable absolute clock reading: a finite, non-negative number within the
 * safe-integer range [0, Number.MAX_SAFE_INTEGER]. Readings feed elapsed-time subtraction and
 * Math.floor(delta / 1000) downstream; past Number.MAX_SAFE_INTEGER (2^53 - 1) millisecond
 * deltas are no longer exactly representable, so an out-of-range reading would corrupt the
 * second count. This is the single source of truth for that contract across createSafeTimeProvider.
 *
 * Number.isFinite performs no coercion (unlike the global isFinite) and returns false for every
 * non-number, NaN and +/-Infinity, so it alone subsumes the former `typeof === 'number'` and
 * `!isNaN(...)` clauses. It must stay first so a runtime non-number short-circuits before the
 * relational comparisons, which would otherwise coerce their operands (e.g. '5' >= 0 === true).
 */
function isValidTime(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER;
}

export function createSafeTimeProvider(): TimeProvider {
  let currentProvider: TimeProvider;
  const fallbackProvider = createDateTimeProvider();

  // Initialize with best available provider
  function initializeProvider(): void {
    try {
      // Test if performance.now() is available and working
      if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        const testTime = performance.now();
        if (isValidTime(testTime)) {
          currentProvider = createPerformanceTimeProvider();
          return;
        }
      }

      throw new Error('performance.now() not available or invalid');
    } catch {
      currentProvider = fallbackProvider;
    }
  }

  // Initialize on creation
  initializeProvider();

  return {
    now: () => {
      try {
        const time = currentProvider.now();
        if (isValidTime(time)) {
          return time;
        }
        throw new Error('Invalid time value returned');
      } catch {
        // Fallback to Date.now() if current provider fails
        if (currentProvider !== fallbackProvider) {
          currentProvider = fallbackProvider;
        }
        try {
          const fallbackTime = fallbackProvider.now();
          if (isValidTime(fallbackTime)) {
            return fallbackTime;
          }
        } catch {
          // Último recurso: retornar 0
        }
        return 0; // Valor seguro mínimo
      }
    },
    get isHighResolution() {
      return currentProvider.isHighResolution;
    },
    get type() {
      return currentProvider.type;
    },
  };
}

/**
 * Wraps any time source so it can only ever emit a finite, non-decreasing value.
 *
 * Elapsed-time measurement requires a monotonic clock; wall-clock sources can jump
 * backward (NTP correction, DST, sleep/wake) and custom providers can return garbage.
 * Any reading that is not a finite number, or that is smaller than the previous one,
 * is repaired by returning the last known-good value — so NaN / Infinity / backward
 * readings can never propagate into downstream duration math.
 *
 * A source that *throws* is intentionally NOT caught here: the exception propagates so
 * the caller's error handling (the Timer's onError path) can react. Only out-of-range
 * values are repaired.
 */
export function createMonotonicTimeSource(source: () => number, startValue = 0): () => number {
  let last = typeof startValue === 'number' && Number.isFinite(startValue) && startValue >= 0 ? startValue : 0;

  return () => {
    const next = source();
    if (typeof next !== 'number' || !Number.isFinite(next) || next < last) {
      return last;
    }
    last = next;
    return last;
  };
}

// Global instance to be used throughout the library
const globalTimeProvider = createSafeTimeProvider();

/**
 * Safe wrapper for getting current timestamp
 * Automatically falls back to Date.now() if performance.now() fails
 */
export function getCurrentTime(): number {
  return globalTimeProvider.now();
}

/**
 * Check if high-resolution timing is available
 */
export function isHighResolutionTimeAvailable(): boolean {
  return globalTimeProvider.isHighResolution;
}

/**
 * Get information about the current time provider
 */
export function getTimeProviderInfo(): { type: string; isHighResolution: boolean } {
  return {
    type: globalTimeProvider.type,
    isHighResolution: globalTimeProvider.isHighResolution,
  };
}
