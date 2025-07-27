/**
 * Time providers with fallbacks for critical APIs
 * Ensures the library works even without modern browser APIs
 */

interface TimeProvider {
  now(): number;
  isHighResolution: boolean;
  type: string;
}

function createPerformanceTimeProvider(): TimeProvider {
  return {
    now: () => performance.now(),
    isHighResolution: true,
    type: 'performance'
  };
}

function createDateTimeProvider(): TimeProvider {
  return {
    now: () => Date.now(),
    isHighResolution: false,
    type: 'date'
  };
}

function createSafeTimeProvider(): TimeProvider {
  let currentProvider: TimeProvider;
  const fallbackProvider = createDateTimeProvider();
  
  // Initialize with best available provider
  function initializeProvider(): void {
    try {
      // Test if performance.now() is available and working
      if (typeof performance !== 'undefined' && 
          typeof performance.now === 'function') {
        const testTime = performance.now();
        if (typeof testTime === 'number' && 
            Number.isFinite(testTime) && 
            !isNaN(testTime) && 
            testTime >= 0 && 
            testTime <= Number.MAX_SAFE_INTEGER) {
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
        if (typeof time === 'number' && 
            Number.isFinite(time) && 
            !isNaN(time) && 
            time >= 0 && 
            time <= Number.MAX_SAFE_INTEGER) {
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
          if (typeof fallbackTime === 'number' && 
              Number.isFinite(fallbackTime) && 
              !isNaN(fallbackTime) && 
              fallbackTime >= 0) {
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
    }
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
    isHighResolution: globalTimeProvider.isHighResolution
  };
}