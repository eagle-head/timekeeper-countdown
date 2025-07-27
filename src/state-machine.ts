export const TimerState = Object.freeze({
  IDLE: "IDLE",
  RUNNING: "RUNNING",
  PAUSED: "PAUSED",
  STOPPED: "STOPPED",
});

export type TimerState = (typeof TimerState)[keyof typeof TimerState];

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
    if (typeof events !== "object" || events === null) {
      throw new Error("events must be an object");
    }

    if (
      events.onStateChange !== undefined &&
      typeof events.onStateChange !== "function"
    ) {
      throw new Error("events.onStateChange must be a function");
    }
  }

  let currentState: TimerState = TimerState.IDLE;

  function transitionTo(newState: TimerState): boolean {
    // Defensive validation of state
    if (!Object.values(TimerState).includes(newState)) {
      return false;
    }

    // If trying to transition to same state, do nothing
    if (currentState === newState) {
      return true;
    }

    // Check if transition is valid (excluding transition to same state)
    if (!isValidTransition(currentState, newState)) {
      return false;
    }

    currentState = newState;

    // Safe callback call
    try {
      events?.onStateChange?.(newState);
    } catch {
      // Silently ignore callback errors
    }

    return true;
  }

  function isValidTransition(from: TimerState, to: TimerState): boolean {
    const validTransitions: Record<TimerState, TimerState[]> = {
      [TimerState.IDLE]: [
        TimerState.RUNNING,
        TimerState.IDLE,
        TimerState.STOPPED,
      ],
      [TimerState.RUNNING]: [
        TimerState.PAUSED,
        TimerState.STOPPED,
        TimerState.IDLE,
      ],
      [TimerState.PAUSED]: [
        TimerState.RUNNING,
        TimerState.STOPPED,
        TimerState.IDLE,
      ],
      [TimerState.STOPPED]: [TimerState.IDLE, TimerState.STOPPED],
    };

    return validTransitions[from].includes(to);
  }

  function start(): boolean {
    if (currentState !== TimerState.IDLE) {
      return false;
    }

    return transitionTo(TimerState.RUNNING);
  }

  function resume(): boolean {
    if (currentState !== TimerState.PAUSED) {
      return false;
    }

    return transitionTo(TimerState.RUNNING);
  }

  function pause(): boolean {
    if (currentState !== TimerState.RUNNING) {
      return false;
    }

    return transitionTo(TimerState.PAUSED);
  }

  function reset(): boolean {
    return transitionTo(TimerState.IDLE);
  }

  function stop(): boolean {
    return transitionTo(TimerState.STOPPED);
  }

  function complete(): boolean {
    return transitionTo(TimerState.STOPPED);
  }

  function destroy(): void {
    transitionTo(TimerState.STOPPED);
  }

  return {
    start,
    resume,
    pause,
    reset,
    stop,
    complete,
    getCurrentState: () => currentState,
    canStart: () => currentState === TimerState.IDLE,
    canResume: () => currentState === TimerState.PAUSED,
    canPause: () => currentState === TimerState.RUNNING,
    isRunning: () => currentState === TimerState.RUNNING,
    destroy,
  };
}

export type StateMachineModule = {
  TimerState: typeof TimerState;
  StateMachine: typeof StateMachine;
};

export { type StateMachineInstance };