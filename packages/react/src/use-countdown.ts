import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CountdownEngine,
  type CountdownEngineInstance,
  type CountdownEngineOptions,
  type CountdownSnapshot,
  TimerState,
} from '@timekeeper-countdown/core';

export interface UseCountdownOptions extends Omit<CountdownEngineOptions, 'onSnapshot' | 'onStateChange' | 'onError'> {
  autoStart?: boolean;
  onSnapshot?: CountdownEngineOptions['onSnapshot'];
  onStateChange?: CountdownEngineOptions['onStateChange'];
  onError?: CountdownEngineOptions['onError'];
}

export interface UseCountdownControls {
  start: () => boolean;
  pause: () => boolean;
  resume: () => boolean;
  reset: (nextInitialSeconds?: number) => boolean;
  stop: () => boolean;
  setSeconds: (value: number) => void;
}

export interface UseCountdownResult extends UseCountdownControls {
  snapshot: CountdownSnapshot;
  state: TimerState;
  totalSeconds: number;
  parts: CountdownSnapshot['parts'];
  isRunning: boolean;
  isCompleted: boolean;
}

const buildInitialSnapshot = (
  initialSeconds: number,
  options: Pick<UseCountdownOptions, 'tickIntervalMs' | 'timeProvider'>
): CountdownSnapshot => {
  const engine = CountdownEngine(initialSeconds, {
    tickIntervalMs: options.tickIntervalMs,
    timeProvider: options.timeProvider,
  });
  const snapshot = engine.getSnapshot();
  engine.destroy();
  return snapshot;
};

export function useCountdown(initialSeconds: number, options: UseCountdownOptions = {}): UseCountdownResult {
  const { autoStart = false, tickIntervalMs, timeProvider, onSnapshot, onStateChange, onError } = options;

  const handlersRef = useRef({ onSnapshot, onStateChange, onError });
  const engineRef = useRef<CountdownEngineInstance | null>(null);
  const [snapshot, setSnapshot] = useState<CountdownSnapshot>(() =>
    buildInitialSnapshot(initialSeconds, { tickIntervalMs, timeProvider })
  );

  useEffect(() => {
    handlersRef.current = { onSnapshot, onStateChange, onError };
  }, [onError, onSnapshot, onStateChange]);

  const engineOptions = useMemo(
    () => ({
      tickIntervalMs,
      timeProvider,
    }),
    [tickIntervalMs, timeProvider]
  );

  useEffect(() => {
    let isMounted = true;
    const engine = CountdownEngine(initialSeconds, {
      ...engineOptions,
      onSnapshot: nextSnapshot => {
        if (isMounted) {
          setSnapshot(nextSnapshot);
        }
        handlersRef.current.onSnapshot?.(nextSnapshot);
      },
      onStateChange: (nextState, nextSnapshot) => {
        handlersRef.current.onStateChange?.(nextState, nextSnapshot);
      },
      onError: error => {
        handlersRef.current.onError?.(error);
      },
    });

    engineRef.current = engine;
    setSnapshot(engine.getSnapshot());

    if (autoStart) {
      engine.start();
    }

    return () => {
      isMounted = false;
      engine.destroy();
      engineRef.current = null;
    };
  }, [autoStart, engineOptions, initialSeconds]);

  const invoke = useCallback(<T>(action: (engine: CountdownEngineInstance) => T, fallback: T) => {
    const engine = engineRef.current;
    if (!engine) {
      return fallback;
    }

    return action(engine);
  }, []);

  const start = useCallback(() => invoke(engine => engine.start(), false), [invoke]);
  const pause = useCallback(() => invoke(engine => engine.pause(), false), [invoke]);
  const resume = useCallback(() => invoke(engine => engine.resume(), false), [invoke]);
  const stop = useCallback(() => invoke(engine => engine.stop(), false), [invoke]);
  const setSeconds = useCallback((value: number) => invoke(engine => engine.setSeconds(value), undefined), [invoke]);
  const reset = useCallback(
    (nextInitialSeconds?: number) => invoke(engine => engine.reset(nextInitialSeconds), false),
    [invoke]
  );

  return {
    snapshot,
    state: snapshot.state,
    totalSeconds: snapshot.totalSeconds,
    parts: snapshot.parts,
    isRunning: snapshot.isRunning,
    isCompleted: snapshot.isCompleted,
    start,
    pause,
    resume,
    reset,
    stop,
    setSeconds,
  };
}
