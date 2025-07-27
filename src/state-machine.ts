import { TimerLogger } from "./logger";

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

export function StateMachine(debug: boolean = false, events?: StateEvents): StateMachineInstance {
  // Validação defensiva de parâmetros
  const safeDebug = typeof debug === "boolean" ? debug : false;

  // Validação dos eventos se fornecidos
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

  const logger = TimerLogger(safeDebug);
  let currentState: TimerState = TimerState.IDLE;

  function transitionTo(newState: TimerState): boolean {
    // Validação defensiva do estado
    if (!Object.values(TimerState).includes(newState)) {
      logger.logValidationError(
        "Invalid state value provided",
        "state",
        newState,
        "INVALID_STATE_VALUE"
      );
      return false;
    }

    // Se tentando transicionar para o mesmo estado, não faz nada
    if (currentState === newState) {
      logger.debug(`Already in state ${newState}, ignoring transition`);
      return true;
    }

    // Verifica se a transição é válida (excluindo transição para o mesmo estado)
    if (!isValidTransition(currentState, newState)) {
      logger.logValidationError(
        `Invalid state transition from ${currentState} to ${newState}`,
        "transition",
        { from: currentState, to: newState },
        "INVALID_STATE_TRANSITION"
      );
      return false;
    }

    const previousState = currentState;
    currentState = newState;
    logger.logStateTransition(previousState, newState);

    // Chamada segura do callback
    try {
      events?.onStateChange?.(newState);
    } catch (error) {
      logger.error("Error in onStateChange callback", {
        error: error instanceof Error ? error.message : String(error),
        state: newState,
      });
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
    logger.functionCall("start", currentState, {});

    if (currentState !== TimerState.IDLE) {
      logger.functionResult("start", "ignored", `state: ${currentState}`);
      return false;
    }

    return transitionTo(TimerState.RUNNING);
  }

  function resume(): boolean {
    logger.functionCall("resume", currentState, {});

    if (currentState !== TimerState.PAUSED) {
      logger.functionResult("resume", "ignored", `state: ${currentState}`);
      return false;
    }

    return transitionTo(TimerState.RUNNING);
  }

  function pause(): boolean {
    logger.functionCall("pause", currentState, {});

    if (currentState !== TimerState.RUNNING) {
      logger.functionResult("pause", "ignored", `state: ${currentState}`);
      return false;
    }

    return transitionTo(TimerState.PAUSED);
  }

  function reset(): boolean {
    logger.functionCall("reset", currentState, {});
    return transitionTo(TimerState.IDLE);
  }

  function stop(): boolean {
    logger.functionCall("stop", currentState, {});
    return transitionTo(TimerState.STOPPED);
  }

  function complete(): boolean {
    logger.debug("Timer completed, transitioning to stopped");
    return transitionTo(TimerState.STOPPED);
  }

  function destroy(): void {
    logger.debug("Destroying state machine");
    currentState = TimerState.IDLE;
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
  StateMachineInstance: typeof StateMachineInstance;
};

export { type StateMachineInstance };
