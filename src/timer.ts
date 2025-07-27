import { getCurrentTime } from "./time-providers";

type TimerID = ReturnType<typeof setInterval>;

interface TimerEvents {
  onTick: (totalSeconds: number) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export function Timer(initialSeconds: number, events: TimerEvents) {
  if (typeof initialSeconds !== "number" || !Number.isFinite(initialSeconds)) {
    throw new Error("initialSeconds must be a finite number");
  }

  if (initialSeconds < 0) {
    throw new Error("initialSeconds must be non-negative");
  }

  if (initialSeconds > Number.MAX_SAFE_INTEGER) {
    throw new Error("initialSeconds exceeds maximum safe integer");
  }

  if (!events || typeof events !== "object") {
    throw new Error("events must be an object");
  }

  if (typeof events.onTick !== "function") {
    throw new Error("events.onTick must be a function");
  }

  if (typeof events.onComplete !== "function") {
    throw new Error("events.onComplete must be a function");
  }

  if (typeof events.onError !== "function") {
    throw new Error("events.onError must be a function");
  }

  let totalSeconds = Math.floor(Math.max(0, initialSeconds));
  let intervalId: TimerID | null = null;
  let startTimestamp: number | null = null;
  let pausedDuration: number = 0;
  let lastReportedSeconds: number = totalSeconds;
  const initialValue = totalSeconds;
  const TICK_INTERVAL = 100; // Check every 100ms for better accuracy

  const createInterval = (): TimerID => {
    return setInterval(() => {
      try {
        if (!startTimestamp) return;

        // Calculate actual elapsed time using safe time provider
        const currentTime = getCurrentTime();
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
        events.onError(
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }, TICK_INTERVAL);
  };

  const start = (): boolean => {
    if (intervalId || totalSeconds <= 0) {
      return false;
    }

    try {
      // If resuming, calculate how much time was already spent
      if (startTimestamp && totalSeconds < initialValue) {
        // Resume from pause: adjust paused duration
        const expectedElapsed = (initialValue - totalSeconds) * 1000;
        pausedDuration = getCurrentTime() - startTimestamp - expectedElapsed;
      } else {
        // Fresh start
        startTimestamp = getCurrentTime();
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
    if (typeof seconds !== "number" || !Number.isFinite(seconds)) {
      return; // Valor seguro: não alterar
    }

    const safeSeconds = Math.floor(
      Math.max(0, Math.min(seconds, Number.MAX_SAFE_INTEGER))
    );
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

  return {
    start,
    stop,
    reset,
    setSeconds,
    getTotalSeconds: () => totalSeconds,
    getInitialValue: () => initialValue,
    isRunning: () => intervalId !== null,
    destroy,
  };
}
