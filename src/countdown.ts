import { Timer } from "./timer";
import { StateMachine, TimerState } from "./state-machine";
import { Formatter } from "./formatter";
import { TimerLogger, ErrorCategory, ErrorSeverity } from "./logger";

interface CountdownOptions {
  onUpdate?: (minutes: string, seconds: string) => void;
  onStateChange?: (state: TimerState) => void;
  debug?: boolean;
}

interface CountdownInstance {
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
  const { onUpdate, onStateChange, debug = false } = options;
  const logger = TimerLogger(debug);
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

  const stateMachine = StateMachine(debug, {
    onStateChange: (state) => {
      if (onStateChange) {
        onStateChange(state);
      }
    }
  });

  const updateUI = (totalSeconds: number) => {
    if (onUpdate && typeof onUpdate === "function") {
      try {
        // Validação defensiva do totalSeconds
        const safeTotalSeconds = typeof totalSeconds === "number" && 
                                Number.isFinite(totalSeconds) && 
                                totalSeconds >= 0 ? totalSeconds : 0;
        
        const { minutes, seconds } = formatter.formatTime(safeTotalSeconds);
        logger.uiUpdate(minutes, seconds);
        onUpdate(minutes, seconds);
      } catch (error) {
        logger.logError(
          "Error in onUpdate callback", 
          error instanceof Error ? error : new Error(String(error)),
          ErrorCategory.UI,
          ErrorSeverity.HIGH,
          "CALLBACK_ERROR"
        );
      }
    }
  };

  const timer = Timer(initialSeconds, {
    onTick: (totalSeconds) => {
      logger.intervalEvent("tick", { totalSeconds });
      updateUI(totalSeconds);
    },
    onComplete: () => {
      logger.debug("Timer completed");
      stateMachine.complete();
      updateUI(0);
    },
    onError: (error) => {
      logger.logError(
        "Timer execution error", 
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.INTERVAL,
        ErrorSeverity.CRITICAL,
        "TIMER_EXECUTION_ERROR"
      );
      stateMachine.stop();
    },
  });

  logger.info(`Creating countdown with ${initialSeconds} seconds`);

  function start(): void {
    try {
      if (stateMachine.canStart() && timer.start()) {
        stateMachine.start();
        updateUI(timer.getTotalSeconds());
      }
    } catch (error) {
      logger.logError(
        "Error starting countdown", 
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.STATE,
        ErrorSeverity.HIGH,
        "START_ERROR"
      );
    }
  }

  function pause(): void {
    try {
      if (stateMachine.canPause()) {
        timer.stop();
        stateMachine.pause();
      }
    } catch (error) {
      logger.error("Error in pause function", {
        error: error instanceof Error ? error.message : String(error)
      });
      // Não re-lança para evitar crash
    }
  }

  function resume(): void {
    try {
      if (stateMachine.canResume() && timer.start()) {
        stateMachine.resume();
        updateUI(timer.getTotalSeconds());
      }
    } catch (error) {
      logger.error("Error in resume function", {
        error: error instanceof Error ? error.message : String(error)
      });
      // Não re-lança para evitar crash
    }
  }

  function reset(): void {
    try {
      timer.reset();
      stateMachine.reset();
      updateUI(timer.getTotalSeconds());
      logger.functionResult("reset", "success");
    } catch (error) {
      logger.error("Error in reset function", {
        error: error instanceof Error ? error.message : String(error)
      });
      // Tenta um reset mais básico em caso de erro
      try {
        timer.stop();
        updateUI(0);
      } catch {
        // Se falhar completamente, apenas log
      }
    }
  }

  function stop(): void {
    try {
      timer.stop();
      stateMachine.stop();
      timer.setSeconds(0);
      updateUI(0);
      logger.functionResult("stop", "success");
    } catch (error) {
      logger.error("Error in stop function", {
        error: error instanceof Error ? error.message : String(error)
      });
      // Tenta um stop mais básico em caso de erro
      try {
        timer.stop();
        updateUI(0);
      } catch {
        // Se falhar completamente, apenas log
      }
    }
  }

  function getSeconds(): string {
    try {
      const totalSeconds = timer.getTotalSeconds();
      const seconds = formatter.formatSeconds(totalSeconds);
      logger.debug("getSeconds() called", {
        totalSeconds,
        returning: seconds,
      });
      return seconds;
    } catch (error) {
      logger.error("Error in getSeconds", {
        error: error instanceof Error ? error.message : String(error)
      });
      return "00"; // Valor seguro
    }
  }

  function getMinutes(): string {
    try {
      const totalSeconds = timer.getTotalSeconds();
      const minutes = formatter.formatMinutes(totalSeconds);
      logger.debug("getMinutes() called", {
        totalSeconds,
        returning: minutes,
      });
      return minutes;
    } catch (error) {
      logger.error("Error in getMinutes", {
        error: error instanceof Error ? error.message : String(error)
      });
      return "00"; // Valor seguro
    }
  }

  function getHours(): string {
    try {
      const totalSeconds = timer.getTotalSeconds();
      const hours = formatter.formatHours(totalSeconds);
      logger.debug("getHours() called", {
        totalSeconds,
        returning: hours,
      });
      return hours;
    } catch (error) {
      logger.error("Error in getHours", {
        error: error instanceof Error ? error.message : String(error)
      });
      return "00"; // Valor seguro
    }
  }

  function getDays(): string {
    try {
      const totalSeconds = timer.getTotalSeconds();
      const days = formatter.formatDays(totalSeconds);
      logger.debug("getDays() called", {
        totalSeconds,
        returning: days,
      });
      return days;
    } catch (error) {
      logger.error("Error in getDays", {
        error: error instanceof Error ? error.message : String(error)
      });
      return "00"; // Valor seguro
    }
  }

  function getWeeks(): string {
    try {
      const totalSeconds = timer.getTotalSeconds();
      const weeks = formatter.formatWeeks(totalSeconds);
      logger.debug("getWeeks() called", {
        totalSeconds,
        returning: weeks,
      });
      return weeks;
    } catch (error) {
      logger.error("Error in getWeeks", {
        error: error instanceof Error ? error.message : String(error)
      });
      return "00"; // Valor seguro
    }
  }

  function getYears(): string {
    try {
      const totalSeconds = timer.getTotalSeconds();
      const years = formatter.formatYears(totalSeconds);
      logger.debug("getYears() called", {
        totalSeconds,
        returning: years,
      });
      return years;
    } catch (error) {
      logger.error("Error in getYears", {
        error: error instanceof Error ? error.message : String(error)
      });
      return "00"; // Valor seguro
    }
  }

  function getCurrentState(): TimerState {
    try {
      return stateMachine.getCurrentState();
    } catch (error) {
      logger.error("Error in getCurrentState", {
        error: error instanceof Error ? error.message : String(error)
      });
      return TimerState.IDLE; // Valor seguro
    }
  }

  function destroy(): void {
    try {
      logger.info("Destroying countdown timer");
      timer.destroy();
      stateMachine.destroy();
      logger.debug("Countdown timer destroyed");
    } catch (error) {
      logger.error("Error in destroy", {
        error: error instanceof Error ? error.message : String(error)
      });
      // Tenta cleanup mínimo em caso de erro
      try {
        timer.stop();
      } catch {
        // Se falhar, apenas ignora
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

export { TimerState, type CountdownInstance };
