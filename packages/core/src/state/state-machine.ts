export const TimerState = Object.freeze({
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  STOPPED: 'STOPPED',
});

export type TimerState = (typeof TimerState)[keyof typeof TimerState];

type TransitionAction = 'start' | 'resume' | 'pause' | 'reset' | 'stop' | 'complete';

type TransitionMap = Record<TimerState, Partial<Record<TransitionAction, TimerState>>>;

const VALID_TRANSITIONS: TransitionMap = {
  [TimerState.IDLE]: {
    start: TimerState.RUNNING,
  },
  [TimerState.RUNNING]: {
    pause: TimerState.PAUSED,
    reset: TimerState.IDLE,
    stop: TimerState.STOPPED,
    complete: TimerState.STOPPED,
  },
  [TimerState.PAUSED]: {
    resume: TimerState.RUNNING,
    reset: TimerState.IDLE,
    stop: TimerState.STOPPED,
  },
  [TimerState.STOPPED]: {
    reset: TimerState.IDLE,
  },
} as const;

interface StateEvents {
  onStateChange?: (to: TimerState) => void;
}

interface StateMachineInstance {
  start: () => boolean;
  resume: () => boolean;
  pause: () => boolean;
  reset: () => boolean;
  stop: () => boolean;
  complete: () => boolean;
  getCurrentState: () => TimerState;
  canStart: () => boolean;
  canResume: () => boolean;
  canPause: () => boolean;
  isRunning: () => boolean;
  destroy: () => void;
}

export function StateMachine(events?: StateEvents): StateMachineInstance {
  // Validate events if provided
  if (events !== undefined) {
    if (typeof events !== 'object' || events === null) {
      throw new Error('events must be an object');
    }

    if (events.onStateChange !== undefined && typeof events.onStateChange !== 'function') {
      throw new Error('events.onStateChange must be a function');
    }
  }

  let currentState: TimerState = TimerState.IDLE;

  function performTransition(action: TransitionAction): boolean {
    const nextState = VALID_TRANSITIONS[currentState]?.[action];

    if (!nextState) {
      return false;
    }

    currentState = nextState;

    // Safe callback call
    try {
      events?.onStateChange?.(nextState);
    } catch {
      // Silently ignore callback errors
    }

    return true;
  }

  function start(): boolean {
    return performTransition('start');
  }

  function resume(): boolean {
    return performTransition('resume');
  }

  function pause(): boolean {
    return performTransition('pause');
  }

  function reset(): boolean {
    return performTransition('reset');
  }

  function stop(): boolean {
    return performTransition('stop');
  }

  function complete(): boolean {
    return performTransition('complete');
  }

  function destroy(): void {
    if (currentState === TimerState.IDLE || currentState === TimerState.STOPPED) {
      return;
    }

    performTransition('stop');
  }

  return {
    start,
    resume,
    pause,
    reset,
    stop,
    complete,
    getCurrentState: () => currentState,
    canStart: () => Boolean(VALID_TRANSITIONS[currentState]?.start),
    canResume: () => Boolean(VALID_TRANSITIONS[currentState]?.resume),
    canPause: () => Boolean(VALID_TRANSITIONS[currentState]?.pause),
    isRunning: () => currentState === TimerState.RUNNING,
    destroy,
  };
}

export type StateMachineModule = {
  TimerState: typeof TimerState;
  StateMachine: typeof StateMachine;
};

export { type StateMachineInstance };
