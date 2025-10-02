import { CountdownEngine, type CountdownSnapshot } from './countdown-engine';
import { TimerState } from '../state/state-machine';
import { Formatter } from '../format/formatter';

export interface CountdownOptions {
  onUpdate?: (minutes: string, seconds: string) => void;
  onStateChange?: (state: TimerState) => void;
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
  const { onUpdate, onStateChange } = options;

  if (onUpdate !== undefined && typeof onUpdate !== 'function') {
    throw new Error('onUpdate must be a function');
  }

  if (onStateChange !== undefined && typeof onStateChange !== 'function') {
    throw new Error('onStateChange must be a function');
  }

  const formatter = Formatter();
  const engine = CountdownEngine(initialSeconds);

  let lastSnapshot = engine.getSnapshot();
  let lastState = lastSnapshot.state;
  let lastNotifiedSeconds = Number.NaN;

  const notifyUpdate = (snapshot: CountdownSnapshot) => {
    if (!onUpdate) return;
    try {
      const { minutes, seconds } = formatter.formatTime(snapshot.totalSeconds);
      onUpdate(minutes, seconds);
    } catch {
      // ignore consumer errors
    }
  };

  const notifyStateChange = (state: TimerState) => {
    if (!onStateChange) return;
    try {
      onStateChange(state);
    } catch {
      // ignore consumer errors
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
      notifyUpdate(snapshot);
    }
  });

  const safeExecute = (action: () => void) => {
    try {
      action();
    } catch {
      // swallow errors to match legacy behaviour
    }
  };

  return {
    start: () => {
      safeExecute(() => {
        engine.start();
      });
    },
    pause: () => {
      safeExecute(() => {
        engine.pause();
      });
    },
    resume: () => {
      safeExecute(() => {
        engine.resume();
      });
    },
    reset: (newInitialSeconds?: number) => {
      safeExecute(() => {
        engine.reset(newInitialSeconds);
      });
    },
    stop: () => {
      safeExecute(() => {
        engine.stop();
      });
    },
    getSeconds: () => {
      try {
        return formatter.formatSeconds(lastSnapshot.totalSeconds);
      } catch {
        return '00';
      }
    },
    getMinutes: () => {
      try {
        return formatter.formatMinutes(lastSnapshot.totalSeconds);
      } catch {
        return '00';
      }
    },
    getHours: () => {
      try {
        return formatter.formatHours(lastSnapshot.totalSeconds);
      } catch {
        return '00';
      }
    },
    getDays: () => {
      try {
        return formatter.formatDays(lastSnapshot.totalSeconds);
      } catch {
        return '00';
      }
    },
    getWeeks: () => {
      try {
        return formatter.formatWeeks(lastSnapshot.totalSeconds);
      } catch {
        return '00';
      }
    },
    getYears: () => {
      try {
        return formatter.formatYears(lastSnapshot.totalSeconds);
      } catch {
        return '00';
      }
    },
    getCurrentState: () => {
      try {
        return lastSnapshot.state;
      } catch {
        return TimerState.IDLE;
      }
    },
    getSnapshot: () => lastSnapshot,
    destroy: () => {
      safeExecute(() => {
        subscription.unsubscribe();
        engine.destroy();
      });
    },
  };
}

export { TimerState };
