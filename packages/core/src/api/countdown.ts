import { CountdownEngine } from './countdown-engine';
import type { CountdownSnapshot } from '../model/countdown-snapshot';
import { TimerState } from '../state/state-machine';
import { Formatter } from '../format/formatter';

export interface CountdownOptions {
  onSnapshot?: (snapshot: CountdownSnapshot) => void;
  onStateChange?: (state: TimerState) => void;
  onError?: (error: Error) => void;
}

export interface CountdownInstance {
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: (newInitialSeconds?: number) => void;
  stop: () => void;
  getSeconds: () => string;
  getMinutes: () => string;
  getHours: () => string;
  getDays: () => string;
  getWeeks: () => string;
  getYears: () => string;
  getCurrentState: () => TimerState;
  getSnapshot: () => CountdownSnapshot;
  destroy: () => void;
}

export function Countdown(initialSeconds: number, options: CountdownOptions = {}): CountdownInstance {
  const { onSnapshot, onStateChange, onError } = options;

  if (onSnapshot !== undefined && typeof onSnapshot !== 'function') {
    throw new Error('onSnapshot must be a function');
  }

  if (onStateChange !== undefined && typeof onStateChange !== 'function') {
    throw new Error('onStateChange must be a function');
  }

  if (onError !== undefined && typeof onError !== 'function') {
    throw new Error('onError must be a function');
  }

  const formatter = Formatter();
  const engine = CountdownEngine(initialSeconds, { onError });

  let lastSnapshot = engine.getSnapshot();
  let lastState = lastSnapshot.state;
  let lastNotifiedSeconds = Number.NaN;

  const handleError = (error: Error) => {
    if (!onError) return;
    try {
      onError(error);
    } catch {
      /* ignore handler errors */
    }
  };

  const notifySnapshot = (snapshot: CountdownSnapshot) => {
    if (!onSnapshot) return;
    try {
      onSnapshot(snapshot);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const notifyStateChange = (state: TimerState) => {
    if (!onStateChange) return;
    try {
      onStateChange(state);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const subscription = engine.subscribe(snapshot => {
    lastSnapshot = snapshot;
    if (snapshot.state !== lastState) {
      lastState = snapshot.state;
      notifyStateChange(snapshot.state);
    }

    if (snapshot.totalSeconds !== lastNotifiedSeconds) {
      lastNotifiedSeconds = snapshot.totalSeconds;
      notifySnapshot(snapshot);
    }
  });

  return {
    start: () => {
      engine.start();
    },
    pause: () => {
      engine.pause();
    },
    resume: () => {
      engine.resume();
    },
    reset: (newInitialSeconds?: number) => {
      engine.reset(newInitialSeconds);
    },
    stop: () => {
      engine.stop();
    },
    getSeconds: () => formatter.formatSeconds(lastSnapshot.totalSeconds),
    getMinutes: () => formatter.formatMinutes(lastSnapshot.totalSeconds),
    getHours: () => formatter.formatHours(lastSnapshot.totalSeconds),
    getDays: () => formatter.formatDays(lastSnapshot.totalSeconds),
    getWeeks: () => formatter.formatWeeks(lastSnapshot.totalSeconds),
    getYears: () => formatter.formatYears(lastSnapshot.totalSeconds),
    getCurrentState: () => lastSnapshot.state,
    getSnapshot: () => lastSnapshot,
    destroy: () => {
      try {
        subscription.unsubscribe();
      } finally {
        engine.destroy();
      }
    },
  };
}

export { TimerState };
