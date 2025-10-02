import { createSafeTimeProvider } from './time-providers';

type TimerID = ReturnType<typeof setInterval>;

interface TimerEvents {
  onTick: (totalSeconds: number) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

interface TimerConfig {
  timeProvider?: () => number;
  tickIntervalMs?: number;
}

export interface TimerInstance {
  start: () => boolean;
  stop: () => void;
  reset: () => void;
  setSeconds: (seconds: number) => void;
  setInitialValue: (seconds: number) => void;
  getTotalSeconds: () => number;
  getInitialValue: () => number;
  isRunning: () => boolean;
  destroy: () => void;
}

export function Timer(initialSeconds: number, events: TimerEvents, config: TimerConfig = {}): TimerInstance {
  if (typeof initialSeconds !== 'number' || !Number.isFinite(initialSeconds)) {
    throw new Error('initialSeconds must be a finite number');
  }

  if (initialSeconds < 0) {
    throw new Error('initialSeconds must be non-negative');
  }

  if (initialSeconds > Number.MAX_SAFE_INTEGER) {
    throw new Error('initialSeconds exceeds maximum safe integer');
  }

  if (!events || typeof events !== 'object') {
    throw new Error('events must be an object');
  }

  if (typeof events.onTick !== 'function') {
    throw new Error('events.onTick must be a function');
  }

  if (typeof events.onComplete !== 'function') {
    throw new Error('events.onComplete must be a function');
  }

  if (typeof events.onError !== 'function') {
    throw new Error('events.onError must be a function');
  }

  let totalSeconds = Math.floor(Math.max(0, initialSeconds));
  let intervalId: TimerID | null = null;
  let startTimestamp: number | null = null;
  let pausedDuration = 0;
  let lastReportedSeconds = totalSeconds;
  let initialValue = totalSeconds;
  const tickInterval = Math.max(10, Math.floor(config.tickIntervalMs ?? 100));
  const defaultProvider = createSafeTimeProvider();
  const timeProvider = config.timeProvider ?? (() => defaultProvider.now());

  const createInterval = (): TimerID => {
    return setInterval(() => {
      try {
        if (startTimestamp === null) return;

        // Calculate actual elapsed time using safe time provider
        const currentTime = timeProvider();
        const elapsedMs = currentTime - startTimestamp - pausedDuration;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        const remainingSeconds = Math.max(0, initialValue - elapsedSeconds);

        // Update totalSeconds to reflect actual time
        totalSeconds = remainingSeconds;

        // Only trigger onTick when the second actually changes
        if (remainingSeconds !== lastReportedSeconds) {
          lastReportedSeconds = remainingSeconds;
          events.onTick(remainingSeconds);
        }

        // Check if timer completed
        if (remainingSeconds === 0) {
          stop();
          events.onComplete();
        }
      } catch (error) {
        stop();
        events.onError(error instanceof Error ? error : new Error(String(error)));
      }
    }, tickInterval);
  };

  const start = (): boolean => {
    if (intervalId || totalSeconds <= 0) {
      return false;
    }

    try {
      // If resuming, calculate how much time was already spent
      if (startTimestamp !== null && totalSeconds < initialValue) {
        // Resume from pause: adjust paused duration
        const expectedElapsed = (initialValue - totalSeconds) * 1000;
        pausedDuration = timeProvider() - startTimestamp - expectedElapsed;
      } else {
        // Fresh start
        startTimestamp = timeProvider();
        pausedDuration = 0;
        lastReportedSeconds = totalSeconds;
      }

      intervalId = createInterval();
      return true;
    } catch (error) {
      events.onError(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  };

  const stop = (): void => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const reset = (): void => {
    stop();
    totalSeconds = initialValue;
    startTimestamp = null;
    pausedDuration = 0;
    lastReportedSeconds = initialValue;
  };

  const setSeconds = (seconds: number): void => {
    // Validação defensiva
    if (typeof seconds !== 'number' || !Number.isFinite(seconds)) {
      return; // Valor seguro: não alterar
    }

    const safeSeconds = Math.floor(Math.max(0, Math.min(seconds, Number.MAX_SAFE_INTEGER)));
    totalSeconds = safeSeconds;
    // Reset timing when manually setting seconds
    startTimestamp = null;
    pausedDuration = 0;
    lastReportedSeconds = safeSeconds;
  };

  const destroy = (): void => {
    stop();
    totalSeconds = 0;
    startTimestamp = null;
    pausedDuration = 0;
  };

  const setInitialValue = (seconds: number): void => {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds)) {
      return;
    }
    const safeSeconds = Math.floor(Math.max(0, Math.min(seconds, Number.MAX_SAFE_INTEGER)));
    initialValue = safeSeconds;
    setSeconds(safeSeconds);
  };

  return {
    start,
    stop,
    reset,
    setSeconds,
    setInitialValue,
    getTotalSeconds: () => totalSeconds,
    getInitialValue: () => initialValue,
    isRunning: () => intervalId !== null,
    destroy,
  };
}
