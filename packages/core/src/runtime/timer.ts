import { MILLISECONDS_PER_SECOND } from '../time/constants';
import { createSafeTimeProvider } from './time-providers';

const MIN_TICK_INTERVAL_MS = 10;
const DEFAULT_TICK_INTERVAL_MS = 100;

/**
 * Resolves a caller-supplied tick interval to a safe `setInterval` delay. An invalid
 * value (non-number, non-finite, or <= 0) falls back to the default; a valid value is
 * floored and clamped to the minimum. This prevents `setInterval(fn, NaN/Infinity/0)`
 * from degenerating into a ~0/1ms CPU tight-loop.
 */
function sanitizeTickInterval(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_TICK_INTERVAL_MS;
  }
  return Math.max(MIN_TICK_INTERVAL_MS, Math.floor(value));
}

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

/**
 * @internal — Use CountdownEngine instead. This is a low-level primitive not
 * intended to be called directly by consumers. The `events` parameter is
 * always provided by CountdownEngine and is guaranteed to be valid.
 */
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

  let totalSeconds = Math.floor(Math.max(0, initialSeconds));
  let intervalId: TimerID | null = null;
  let startTimestamp: number | null = null;
  let pausedDuration = 0;
  let lastReportedSeconds = totalSeconds;
  let initialValue = totalSeconds;
  const tickInterval = sanitizeTickInterval(config.tickIntervalMs);
  const defaultProvider = createSafeTimeProvider();
  const timeProvider = config.timeProvider ?? (() => defaultProvider.now());

  const createInterval = (): TimerID => {
    return setInterval(() => {
      try {
        if (startTimestamp === null) return;

        // Calculate actual elapsed time using safe time provider
        const currentTime = timeProvider();
        const elapsedMs = currentTime - startTimestamp - pausedDuration;
        const elapsedSeconds = Math.floor(elapsedMs / MILLISECONDS_PER_SECOND);
        // Clamp remaining to [0, initialValue]. The upper bound makes a backward clock
        // (or negative elapsed) unable to count the timer UP; a non-finite elapsed holds
        // the last value rather than corrupting state with NaN. Defense-in-depth: the
        // engine already feeds this a monotonic, finite clock via createMonotonicTimeSource.
        const remainingSeconds = Number.isFinite(elapsedSeconds)
          ? Math.min(initialValue, Math.max(0, initialValue - elapsedSeconds))
          : initialValue;

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
        const expectedElapsed = (initialValue - totalSeconds) * MILLISECONDS_PER_SECOND;
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
