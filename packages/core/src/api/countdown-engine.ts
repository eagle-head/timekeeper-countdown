import { Timer } from '../runtime/timer';
import { createSafeTimeProvider, createMonotonicTimeSource, type TimeProvider } from '../runtime/time-providers';
import { StateMachine, TimerState } from '../state/state-machine';
import { decompose, type CountdownParts } from '../time/decompose';

export type { CountdownParts };

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
  let source: () => number;

  if (!provider) {
    const safeProvider = createSafeTimeProvider();
    source = () => safeProvider.now();
  } else if (typeof provider === 'function') {
    source = provider;
  } else if (typeof provider.now === 'function') {
    const ref = provider;
    source = () => ref.now();
  } else {
    throw new Error('timeProvider must implement a now(): number method');
  }

  // Elapsed-time math requires a finite, monotonic non-decreasing clock. Wrapping
  // every resolved provider (default OR caller-supplied) makes a NaN/Infinity/
  // backward reading (NTP/DST/sleep-wake, or a buggy custom provider) unrepresentable
  // downstream: such readings are repaired to the last known-good value instead of
  // corrupting the countdown. A provider that *throws* still propagates to the
  // timer's onError path — only out-of-range *values* are repaired here.
  return createMonotonicTimeSource(source);
}

export function buildSnapshot(initialSeconds: number, totalSeconds: number, state: TimerState): CountdownSnapshot {
  const parts = decompose(totalSeconds);
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
    // Same validation policy as the constructor and reset(n): reject invalid input
    // loudly instead of silently coercing it. The internal Timer keeps its own
    // defensive clamp as defense-in-depth.
    const safeSeconds = sanitizeInitialSeconds(seconds);
    timer.setSeconds(safeSeconds);
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
