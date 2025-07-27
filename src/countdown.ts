import { Timer } from "./timer";
import { StateMachine, TimerState } from "./state-machine";
import { Formatter } from "./formatter";

export interface CountdownOptions {
  onUpdate?: (minutes: string, seconds: string) => void;
  onStateChange?: (state: TimerState) => void;
}

export interface CountdownInstance {
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  stop: () => void;
  getSeconds: () => string;
  getMinutes: () => string;
  getHours: () => string;
  getDays: () => string;
  getWeeks: () => string;
  getYears: () => string;
  getCurrentState: () => TimerState;
  destroy: () => void;
}

export function Countdown(
  initialSeconds: number,
  options: CountdownOptions = {}
): CountdownInstance {
  const { onUpdate, onStateChange } = options;
  const formatter = Formatter();

  // Validation
  if (
    typeof initialSeconds !== "number" ||
    !Number.isInteger(initialSeconds) ||
    initialSeconds < 0
  ) {
    throw new Error("initialSeconds must be a non-negative integer");
  }

  if (initialSeconds > Number.MAX_SAFE_INTEGER) {
    throw new Error("initialSeconds exceeds maximum safe integer");
  }

  if (onUpdate !== undefined && typeof onUpdate !== "function") {
    throw new Error("onUpdate must be a function");
  }

  const stateMachine = StateMachine({
    onStateChange: (state) => {
      if (onStateChange) {
        onStateChange(state);
      }
    }
  });

  const updateUI = (totalSeconds: number) => {
    if (onUpdate && typeof onUpdate === "function") {
      try {
        // Defensive validation of totalSeconds
        const safeTotalSeconds = typeof totalSeconds === "number" && 
                                Number.isFinite(totalSeconds) && 
                                totalSeconds >= 0 ? totalSeconds : 0;
        
        const { minutes, seconds } = formatter.formatTime(safeTotalSeconds);
        onUpdate(minutes, seconds);
      } catch {
        // Silently ignore errors in callbacks
      }
    }
  };

  const timer = Timer(initialSeconds, {
    onTick: (totalSeconds) => {
      updateUI(totalSeconds);
    },
    onComplete: () => {
      stateMachine.complete();
      updateUI(0);
    },
    onError: () => {
      stateMachine.stop();
    },
  });

  function start(): void {
    try {
      if (stateMachine.canStart() && timer.start()) {
        stateMachine.start();
        updateUI(timer.getTotalSeconds());
      }
    } catch {
      // Silently handle errors
    }
  }

  function pause(): void {
    try {
      if (stateMachine.canPause()) {
        timer.stop();
        stateMachine.pause();
      }
    } catch {
      // Silently handle errors
    }
  }

  function resume(): void {
    try {
      if (stateMachine.canResume() && timer.start()) {
        stateMachine.resume();
        updateUI(timer.getTotalSeconds());
      }
    } catch {
      // Silently handle errors
    }
  }

  function reset(): void {
    try {
      timer.reset();
      stateMachine.reset();
      updateUI(timer.getTotalSeconds());
    } catch {
      // Try basic reset on error
      try {
        timer.stop();
        updateUI(0);
      } catch {
        // If completely fails, just ignore
      }
    }
  }

  function stop(): void {
    try {
      timer.stop();
      stateMachine.stop();
      timer.setSeconds(0);
      updateUI(0);
    } catch {
      // Try basic stop on error
      try {
        timer.stop();
        updateUI(0);
      } catch {
        // If completely fails, just ignore
      }
    }
  }

  function getSeconds(): string {
    try {
      const totalSeconds = timer.getTotalSeconds();
      const seconds = formatter.formatSeconds(totalSeconds);
      return seconds;
    } catch {
      return "00"; // Safe value
    }
  }

  function getMinutes(): string {
    try {
      const totalSeconds = timer.getTotalSeconds();
      const minutes = formatter.formatMinutes(totalSeconds);
      return minutes;
    } catch {
      return "00"; // Safe value
    }
  }

  function getHours(): string {
    try {
      const totalSeconds = timer.getTotalSeconds();
      const hours = formatter.formatHours(totalSeconds);
      return hours;
    } catch {
      return "00"; // Safe value
    }
  }

  function getDays(): string {
    try {
      const totalSeconds = timer.getTotalSeconds();
      const days = formatter.formatDays(totalSeconds);
      return days;
    } catch {
      return "00"; // Safe value
    }
  }

  function getWeeks(): string {
    try {
      const totalSeconds = timer.getTotalSeconds();
      const weeks = formatter.formatWeeks(totalSeconds);
      return weeks;
    } catch {
      return "00"; // Safe value
    }
  }

  function getYears(): string {
    try {
      const totalSeconds = timer.getTotalSeconds();
      const years = formatter.formatYears(totalSeconds);
      return years;
    } catch {
      return "00"; // Safe value
    }
  }

  function getCurrentState(): TimerState {
    try {
      return stateMachine.getCurrentState();
    } catch {
      return TimerState.IDLE; // Safe value
    }
  }

  function destroy(): void {
    try {
      timer.destroy();
      stateMachine.destroy();
    } catch {
      // Try minimal cleanup on error
      try {
        timer.stop();
      } catch {
        // If fails, just ignore
      }
    }
  }

  return {
    start,
    pause,
    resume,
    reset,
    stop,
    getSeconds,
    getMinutes,
    getHours,
    getDays,
    getWeeks,
    getYears,
    getCurrentState,
    destroy,
  };
}

export { TimerState };