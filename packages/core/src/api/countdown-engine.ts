import { Timer } from '../runtime/timer';
import { createSafeTimeProvider, type TimeProvider } from '../runtime/time-providers';
import { StateMachine, TimerState } from '../state/state-machine';
import {
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
  SECONDS_PER_WEEK,
  SECONDS_PER_YEAR,
  DAYS_PER_WEEK,
  HOURS_PER_DAY,
  MINUTES_PER_HOUR,
  WEEKS_PER_YEAR,
} from '../time/constants';

export interface CountdownParts {
  years: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
}

export interface CountdownSnapshot {
  initialSeconds: number;
  totalSeconds: number;
  parts: CountdownParts;
  state: TimerState;
  isRunning: boolean;
  isCompleted: boolean;
}

export interface CountdownSubscription {
  unsubscribe: () => void;
}

export interface CountdownEngineOptions {
  onSnapshot?: (snapshot: CountdownSnapshot) => void;
  onStateChange?: (state: TimerState, snapshot: CountdownSnapshot) => void;
  onError?: (error: Error) => void;
  timeProvider?: TimeProvider | (() => number);
  tickIntervalMs?: number;
}

export interface CountdownEngineInstance {
  start: () => boolean;
  pause: () => boolean;
  resume: () => boolean;
  reset: (nextInitialSeconds?: number) => boolean;
  stop: () => boolean;
  setSeconds: (seconds: number) => void;
  getSnapshot: () => CountdownSnapshot;
  subscribe: (listener: (snapshot: CountdownSnapshot) => void) => CountdownSubscription;
  destroy: () => void;
}

function sanitizeInitialSeconds(value: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error('initialSeconds must be a finite, non-negative integer');
  }

  if (value < 0) {
    throw new Error('initialSeconds must be non-negative');
  }

  if (value > Number.MAX_SAFE_INTEGER) {
    throw new Error('initialSeconds exceeds maximum safe integer');
  }

  return value;
}

function resolveTimeProvider(provider?: TimeProvider | (() => number)): () => number {
  if (!provider) {
    const safeProvider = createSafeTimeProvider();
    return () => safeProvider.now();
  }

  if (typeof provider === 'function') {
    return provider;
  }

  if (typeof provider.now === 'function') {
    const ref = provider;
    return () => ref.now();
  }

  throw new Error('timeProvider must implement a now(): number method');
}

function computeParts(totalSeconds: number): CountdownParts {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const years = Math.floor(safeSeconds / SECONDS_PER_YEAR);
  const weeks = Math.floor(safeSeconds / SECONDS_PER_WEEK) % WEEKS_PER_YEAR;
  const days = Math.floor(safeSeconds / SECONDS_PER_DAY) % DAYS_PER_WEEK;
  const hours = Math.floor(safeSeconds / SECONDS_PER_HOUR) % HOURS_PER_DAY;
  const minutes = Math.floor(safeSeconds / SECONDS_PER_MINUTE) % MINUTES_PER_HOUR;
  const seconds = safeSeconds % SECONDS_PER_MINUTE;

  const totalDays = Math.floor(safeSeconds / SECONDS_PER_DAY);
  const totalHours = Math.floor(safeSeconds / SECONDS_PER_HOUR);
  const totalMinutes = Math.floor(safeSeconds / SECONDS_PER_MINUTE);

  return {
    years,
    weeks,
    days,
    hours,
    minutes,
    seconds,
    totalDays,
    totalHours,
    totalMinutes,
  };
}

export function buildSnapshot(initialSeconds: number, totalSeconds: number, state: TimerState): CountdownSnapshot {
  const parts = computeParts(totalSeconds);
  return {
    initialSeconds,
    totalSeconds,
    parts,
    state,
    isRunning: state === TimerState.RUNNING,
    isCompleted: totalSeconds === 0 && state === TimerState.STOPPED,
  };
}

export function CountdownEngine(
  initialSecondsInput: number,
  options: CountdownEngineOptions = {}
): CountdownEngineInstance {
  const initialSeconds = sanitizeInitialSeconds(initialSecondsInput);
  const getNow = resolveTimeProvider(options.timeProvider);
  let currentInitialSeconds = initialSeconds;
  let currentSnapshot = buildSnapshot(initialSeconds, initialSeconds, TimerState.IDLE);
  const observers = new Set<(snapshot: CountdownSnapshot) => void>();

  const notifySnapshot = (snapshot: CountdownSnapshot) => {
    try {
      options.onSnapshot?.(snapshot);
    } catch {
      // ignore observer errors from options
    }

    for (const listener of observers) {
      try {
        listener(snapshot);
      } catch {
        // ignore consumer listener errors
      }
    }
  };

  const signalStateChange = (state: TimerState) => {
    currentSnapshot = buildSnapshot(currentInitialSeconds, currentSnapshot.totalSeconds, state);
    try {
      options.onStateChange?.(state, currentSnapshot);
    } catch {
      // swallow observer errors
    }

    notifySnapshot(currentSnapshot);
  };

  const handleSnapshotUpdate = (totalSeconds: number) => {
    currentSnapshot = buildSnapshot(currentInitialSeconds, totalSeconds, stateMachine.getCurrentState());
    notifySnapshot(currentSnapshot);
  };

  const handleError = (error: Error) => {
    try {
      options.onError?.(error);
    } catch {
      // ignore observer errors
    }
  };

  const stateMachine = StateMachine({
    onStateChange: newState => {
      signalStateChange(newState);
    },
  });

  const timer = Timer(
    initialSeconds,
    {
      onTick: totalSeconds => {
        handleSnapshotUpdate(totalSeconds);
      },
      onComplete: () => {
        stateMachine.complete();
        handleSnapshotUpdate(0);
      },
      onError: error => {
        handleError(error);
        stateMachine.stop();
      },
    },
    {
      timeProvider: getNow,
      tickIntervalMs: options.tickIntervalMs,
    }
  );

  const start = (): boolean => {
    if (!stateMachine.canStart()) {
      return false;
    }

    const started = timer.start();
    if (started) {
      stateMachine.start();
      handleSnapshotUpdate(timer.getTotalSeconds());
    }

    return started;
  };

  const pause = (): boolean => {
    if (!stateMachine.canPause()) {
      return false;
    }

    timer.stop();
    const transitioned = stateMachine.pause();
    if (transitioned) {
      handleSnapshotUpdate(timer.getTotalSeconds());
    }

    return transitioned;
  };

  const resume = (): boolean => {
    if (!stateMachine.canResume()) {
      return false;
    }

    const resumed = timer.start();
    if (resumed) {
      stateMachine.resume();
      handleSnapshotUpdate(timer.getTotalSeconds());
    }

    return resumed;
  };

  const stop = (): boolean => {
    timer.stop();
    const transitioned = stateMachine.stop();
    if (transitioned) {
      timer.setSeconds(0);
      handleSnapshotUpdate(0);
    }

    return transitioned;
  };

  const reset = (nextInitialSeconds?: number): boolean => {
    timer.stop();
    if (typeof nextInitialSeconds === 'number') {
      const safeNextInitial = sanitizeInitialSeconds(nextInitialSeconds);
      currentInitialSeconds = safeNextInitial;
      timer.setInitialValue(safeNextInitial);
    } else {
      currentInitialSeconds = initialSeconds;
      timer.reset();
    }
    stateMachine.reset();
    handleSnapshotUpdate(timer.getTotalSeconds());

    return true;
  };

  const setSeconds = (seconds: number): void => {
    timer.setSeconds(seconds);
    handleSnapshotUpdate(timer.getTotalSeconds());
  };

  const getSnapshot = () => currentSnapshot;

  const subscribe = (listener: (snapshot: CountdownSnapshot) => void): CountdownSubscription => {
    observers.add(listener);
    try {
      listener(currentSnapshot);
    } catch {
      // ignore listener errors on initial emit
    }

    return {
      unsubscribe: () => {
        observers.delete(listener);
      },
    };
  };

  const destroy = () => {
    timer.destroy();
    stateMachine.destroy();
    observers.clear();
    currentSnapshot = buildSnapshot(currentInitialSeconds, 0, TimerState.STOPPED);
  };

  return {
    start,
    pause,
    resume,
    reset,
    stop,
    setSeconds,
    getSnapshot,
    subscribe,
    destroy,
  };
}
