import * as React from "react";
import { validateInitialSeconds, getDays, getHours, getMinutes, getSeconds } from "../utils/time";
import { useImmerReducer } from "use-immer";
import { countdownReducer } from "../reducers/countdown";
import type { Action, State } from "../types/countdown";
import { CountdownState, ActionTypes } from "../types/countdown";

export function useCountdown(initialSeconds: number) {
  initialSeconds = validateInitialSeconds(initialSeconds);

  const timerId = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialSecondsRef = React.useRef(initialSeconds);
  const [{ seconds: totalSeconds, state }, dispatch] = useImmerReducer<State, Action>(countdownReducer, {
    seconds: initialSeconds,
    state: CountdownState.IDLE,
  });

  React.useEffect(() => {
    if (state === CountdownState.RUNNING) {
      timerId.current = setInterval(() => {
        dispatch({ type: ActionTypes.TICK });
      }, 1000);
    }

    if (totalSeconds <= 0 && state === CountdownState.RUNNING) {
      dispatch({ type: ActionTypes.COMPLETE });
    }

    return () => {
      if (timerId.current) {
        clearInterval(timerId.current);
        timerId.current = null;
      }
    };
  }, [state, totalSeconds, dispatch]);

  const setInitialSeconds = React.useCallback((newInitialSeconds: number) => {
    const validatedSeconds = validateInitialSeconds(newInitialSeconds);
    initialSecondsRef.current = validatedSeconds;
  }, []);

  const start = React.useCallback(() => {
    if (state === CountdownState.IDLE) {
      return dispatch({ type: ActionTypes.START });
    }
  }, [dispatch, state]);

  const pause = React.useCallback(() => {
    if (state === CountdownState.RUNNING) {
      return dispatch({ type: ActionTypes.PAUSE });
    }
  }, [dispatch, state]);

  const reset = React.useCallback(
    (newInitialSeconds?: number) => {
      const updatedInitialSeconds = newInitialSeconds
        ? validateInitialSeconds(newInitialSeconds)
        : initialSecondsRef.current;

      if (newInitialSeconds) {
        setInitialSeconds(updatedInitialSeconds);
      }

      if (state !== CountdownState.RUNNING) {
        return dispatch({ type: ActionTypes.RESET, initialSeconds: updatedInitialSeconds });
      }
    },
    [dispatch, setInitialSeconds, state],
  );

  const resume = React.useCallback(() => {
    if (state === CountdownState.PAUSED) {
      return dispatch({ type: ActionTypes.START });
    }
  }, [dispatch, state]);

  const restart = React.useCallback(
    (newInitialSeconds?: number) => {
      const updatedInitialSeconds = validateInitialSeconds(
        newInitialSeconds ? newInitialSeconds : initialSecondsRef.current,
      );

      if (newInitialSeconds) {
        setInitialSeconds(updatedInitialSeconds);
      }

      if (state !== CountdownState.IDLE) {
        return dispatch({ type: ActionTypes.RESTART, initialSeconds: updatedInitialSeconds });
      }
    },
    [dispatch, setInitialSeconds, state],
  );

  return {
    totalSeconds,
    days: getDays(totalSeconds),
    hours: getHours(totalSeconds),
    minutes: getMinutes(totalSeconds),
    seconds: getSeconds(totalSeconds),
    start,
    pause,
    reset,
    state,
    restart,
    resume,
  };
}
