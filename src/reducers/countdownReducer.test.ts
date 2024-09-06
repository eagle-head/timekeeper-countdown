import { describe, test, expect } from "vitest";
import { countdownReducer } from "./countdown";
import { CountdownState, ActionTypes, Action, State } from "../types/countdown";
import { useImmerReducer } from "use-immer";
import { renderHook, act } from "@testing-library/react";

describe("countdownReducer", () => {
  const initialState: State = {
    seconds: 60,
    state: CountdownState.IDLE,
  };

  const reducerTester = (action: Action, expectedState: Partial<State>) => {
    const { result } = renderHook(() => useImmerReducer(countdownReducer, initialState));

    act(() => {
      result.current[1](action);
    });

    const [state] = result.current;
    expect(state).toEqual(expect.objectContaining(expectedState));
  };

  test("should handle START action", () => {
    reducerTester({ type: ActionTypes.START }, { state: CountdownState.RUNNING });
  });

  test("should handle PAUSE action", () => {
    const { result } = renderHook(() =>
      useImmerReducer(countdownReducer, { ...initialState, state: CountdownState.RUNNING }),
    );

    act(() => {
      result.current[1]({ type: ActionTypes.PAUSE });
    });

    const [state] = result.current;
    expect(state.state).toBe(CountdownState.PAUSED);
  });

  test("should handle RESET action", () => {
    const { result } = renderHook(() =>
      useImmerReducer(countdownReducer, { ...initialState, state: CountdownState.RUNNING }),
    );

    act(() => {
      result.current[1]({ type: ActionTypes.RESET, initialSeconds: 30 });
    });

    const [state] = result.current;
    expect(state.state).toBe(CountdownState.IDLE);
    expect(state.seconds).toBe(30);
  });

  test("should handle TICK action", () => {
    const { result } = renderHook(() =>
      useImmerReducer(countdownReducer, { ...initialState, state: CountdownState.RUNNING, seconds: 10 }),
    );

    act(() => {
      result.current[1]({ type: ActionTypes.TICK });
    });

    const [state] = result.current;
    expect(state.seconds).toBe(9);
  });

  test("should handle COMPLETE action", () => {
    const { result } = renderHook(() =>
      useImmerReducer(countdownReducer, { ...initialState, state: CountdownState.RUNNING, seconds: 1 }),
    );

    act(() => {
      result.current[1]({ type: ActionTypes.COMPLETE });
    });

    const [state] = result.current;
    expect(state.state).toBe(CountdownState.COMPLETED);
    expect(state.seconds).toBe(0);
  });

  test("should handle RESTART action", () => {
    const { result } = renderHook(() =>
      useImmerReducer(countdownReducer, { ...initialState, state: CountdownState.PAUSED }),
    );

    act(() => {
      result.current[1]({ type: ActionTypes.RESTART, initialSeconds: 45 });
    });

    const [state] = result.current;
    expect(state.state).toBe(CountdownState.RUNNING);
    expect(state.seconds).toBe(45);
  });
});
