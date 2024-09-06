import { renderHook, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { useCountdown } from "./useCountdown";
import { CountdownState } from "../types/countdown";

const EXCEEDED_MAX_SECONDS = 10000000;
const EXCEEDED_MIN_SECONDS = 0;

describe("Countdown hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should initialize with correct values for 60 seconds", () => {
    const { result } = renderHook(() => useCountdown(60));
    expect(result.current.totalSeconds).toBe(60);
    expect(result.current.minutes).toBe(1);
    expect(result.current.seconds).toBe(0);
    expect(result.current.hours).toBe(0);
    expect(result.current.days).toBe(0);
  });

  test("should initialize with correct values for 25 seconds", () => {
    const { result } = renderHook(() => useCountdown(25));
    expect(result.current.totalSeconds).toBe(25);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(25);
    expect(result.current.hours).toBe(0);
    expect(result.current.days).toBe(0);
  });

  test("should initialize with correct values for 60.15 seconds", () => {
    const { result } = renderHook(() => useCountdown(60.15));
    expect(result.current.totalSeconds).toBe(60);
    expect(result.current.minutes).toBe(1);
    expect(result.current.seconds).toBe(0);
    expect(result.current.hours).toBe(0);
    expect(result.current.days).toBe(0);
  });

  test("should set to maximum allowed seconds if initial seconds exceed the maximum", () => {
    const { result } = renderHook(() => useCountdown(EXCEEDED_MAX_SECONDS));
    expect(result.current.totalSeconds).toBe(99 * 3600 * 24);
    expect(result.current.days).toBe(99);
    expect(result.current.hours).toBe(0);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(0);
  });

  test("should set to minimum allowed seconds if initial seconds are less than the minimum", () => {
    const { result } = renderHook(() => useCountdown(EXCEEDED_MIN_SECONDS));
    expect(result.current.totalSeconds).toBe(1);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(1);
    expect(result.current.hours).toBe(0);
    expect(result.current.days).toBe(0);
  });

  test("should set to minimum allowed seconds if initial seconds are NaN", () => {
    const { result } = renderHook(() => useCountdown(NaN));
    expect(result.current.totalSeconds).toBe(1);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(1);
    expect(result.current.hours).toBe(0);
    expect(result.current.days).toBe(0);
  });

  test("should return '00:00' after 30 seconds have elapsed", () => {
    const { result } = renderHook(() => useCountdown(30));

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(30000));

    expect(result.current.totalSeconds).toBe(0);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(0);
    expect(result.current.hours).toBe(0);
    expect(result.current.days).toBe(0);
    expect(result.current.state).toBe(CountdownState.COMPLETED);
  });

  test("Scenario 1: Initialization and basic usage", () => {
    const { result } = renderHook(() => useCountdown(60));

    // Initial state
    expect(result.current.state).toBe(CountdownState.IDLE);
    expect(result.current.totalSeconds).toBe(60);

    // Start the countdown
    act(() => result.current.start());
    expect(result.current.state).toBe(CountdownState.RUNNING);

    // Pause the countdown
    act(() => result.current.pause());
    expect(result.current.state).toBe(CountdownState.PAUSED);

    // Resume the countdown
    act(() => result.current.resume());
    expect(result.current.state).toBe(CountdownState.RUNNING);

    // Pause the countdown again
    act(() => result.current.pause());
    expect(result.current.state).toBe(CountdownState.PAUSED);

    // Reset the countdown
    act(() => result.current.reset());
    expect(result.current.state).toBe(CountdownState.IDLE);
    expect(result.current.totalSeconds).toBe(60);
  });

  test("Scenario 2: Restarting the countdown", () => {
    const { result } = renderHook(() => useCountdown(60));

    // Initial state
    expect(result.current.state).toBe(CountdownState.IDLE);
    expect(result.current.totalSeconds).toBe(60);

    // Start the countdown
    act(() => result.current.start());
    expect(result.current.state).toBe(CountdownState.RUNNING);

    // Pause the countdown
    act(() => result.current.pause());
    expect(result.current.state).toBe(CountdownState.PAUSED);

    // Restart the countdown with new initial seconds
    act(() => result.current.restart(30));
    expect(result.current.state).toBe(CountdownState.RUNNING);
    expect(result.current.totalSeconds).toBe(30);

    // Pause the countdown again
    act(() => result.current.pause());
    expect(result.current.state).toBe(CountdownState.PAUSED);

    // Reset the countdown
    act(() => result.current.reset());
    expect(result.current.state).toBe(CountdownState.IDLE);
    expect(result.current.totalSeconds).toBe(30);
  });

  test("Scenario 3: Completing the countdown", () => {
    const { result } = renderHook(() => useCountdown(5));

    // Initial state
    expect(result.current.state).toBe(CountdownState.IDLE);
    expect(result.current.totalSeconds).toBe(5);

    // Start the countdown
    act(() => result.current.start());
    expect(result.current.state).toBe(CountdownState.RUNNING);

    // Advance timers to complete the countdown
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.state).toBe(CountdownState.COMPLETED);
    expect(result.current.totalSeconds).toBe(0);

    // Reset the countdown
    act(() => result.current.reset());
    expect(result.current.state).toBe(CountdownState.IDLE);
    expect(result.current.totalSeconds).toBe(5);
  });

  test("Scenario 4: Testing state boundaries", () => {
    const { result } = renderHook(() => useCountdown(10));

    // Initial state
    expect(result.current.state).toBe(CountdownState.IDLE);
    expect(result.current.totalSeconds).toBe(10);

    // Reset from IDLE (should remain IDLE)
    act(() => result.current.reset());
    expect(result.current.state).toBe(CountdownState.IDLE);

    // Start the countdown
    act(() => result.current.start());
    expect(result.current.state).toBe(CountdownState.RUNNING);

    // Start while RUNNING (should remain RUNNING)
    act(() => result.current.start());
    expect(result.current.state).toBe(CountdownState.RUNNING);

    // Pause the countdown
    act(() => result.current.pause());
    expect(result.current.state).toBe(CountdownState.PAUSED);

    // Pause while PAUSED (should remain PAUSED)
    act(() => result.current.pause());
    expect(result.current.state).toBe(CountdownState.PAUSED);

    // Resume the countdown
    act(() => result.current.resume());
    expect(result.current.state).toBe(CountdownState.RUNNING);

    // Resume while RUNNING (should remain RUNNING)
    act(() => result.current.resume());
    expect(result.current.state).toBe(CountdownState.RUNNING);

    // Restart with new initial seconds
    act(() => result.current.restart(60));
    expect(result.current.state).toBe(CountdownState.RUNNING);
    expect(result.current.totalSeconds).toBe(60);

    // Restart without new initial seconds (should remain RUNNING)
    act(() => result.current.restart());
    expect(result.current.state).toBe(CountdownState.RUNNING);
    expect(result.current.totalSeconds).toBe(60);

    // Pause the countdown
    act(() => result.current.pause());
    expect(result.current.state).toBe(CountdownState.PAUSED);

    // Restart with new initial seconds from PAUSED
    act(() => result.current.restart(30));
    expect(result.current.state).toBe(CountdownState.RUNNING);
    expect(result.current.totalSeconds).toBe(30);

    // Reset with new initial seconds from PAUSED
    act(() => result.current.pause()); // Pause before reset
    act(() => result.current.reset(20));
    expect(result.current.state).toBe(CountdownState.IDLE);
    expect(result.current.totalSeconds).toBe(20);

    // Start the countdown
    act(() => result.current.start());
    expect(result.current.state).toBe(CountdownState.RUNNING);

    // Pause the countdown
    act(() => result.current.pause());
    expect(result.current.state).toBe(CountdownState.PAUSED);

    // Reset from PAUSED
    act(() => result.current.reset());
    expect(result.current.state).toBe(CountdownState.IDLE);
    expect(result.current.totalSeconds).toBe(20);

    // Reset from PAUSED with new initial seconds
    act(() => result.current.pause());
    act(() => result.current.reset(15));
    expect(result.current.state).toBe(CountdownState.IDLE);
    expect(result.current.totalSeconds).toBe(15);
  });

  test("Scenario 5: Restart without new value", () => {
    const { result } = renderHook(() => useCountdown(10));

    // Initial state
    expect(result.current.state).toBe(CountdownState.IDLE);
    expect(result.current.totalSeconds).toBe(10);

    // Start the countdown
    act(() => result.current.start());
    expect(result.current.state).toBe(CountdownState.RUNNING);

    // Pause the countdown
    act(() => result.current.pause());
    expect(result.current.state).toBe(CountdownState.PAUSED);

    // Restart without new initial seconds
    act(() => result.current.restart());
    expect(result.current.state).toBe(CountdownState.RUNNING);
    expect(result.current.totalSeconds).toBe(10);

    // Pause the countdown
    act(() => result.current.pause());
    expect(result.current.state).toBe(CountdownState.PAUSED);

    // Reset the countdown
    act(() => result.current.reset());
    expect(result.current.state).toBe(CountdownState.IDLE);
    expect(result.current.totalSeconds).toBe(10);
  });

  test("Scenario 6: Complete and restart", () => {
    const { result } = renderHook(() => useCountdown(10));

    // Initial state
    expect(result.current.state).toBe(CountdownState.IDLE);
    expect(result.current.totalSeconds).toBe(10);

    // Start the countdown
    act(() => result.current.start());
    expect(result.current.state).toBe(CountdownState.RUNNING);

    // Advance time to complete the countdown
    act(() => vi.advanceTimersByTime(10000));
    expect(result.current.state).toBe(CountdownState.COMPLETED);
    expect(result.current.totalSeconds).toBe(0);

    // Restart with new initial seconds
    act(() => result.current.restart(30));
    expect(result.current.state).toBe(CountdownState.RUNNING);
    expect(result.current.totalSeconds).toBe(30);

    // Advance time to complete the countdown again
    act(() => vi.advanceTimersByTime(30000));
    expect(result.current.state).toBe(CountdownState.COMPLETED);
    expect(result.current.totalSeconds).toBe(0);

    // Reset with new initial seconds
    act(() => result.current.reset(60));
    expect(result.current.state).toBe(CountdownState.IDLE);
    expect(result.current.totalSeconds).toBe(60);
  });

  test("restart should not dispatch when state is IDLE", () => {
    const { result } = renderHook(() => useCountdown(60));

    // Initial state is IDLE
    expect(result.current.state).toBe(CountdownState.IDLE);

    // Attempt to restart while IDLE
    act(() => result.current.restart(30));

    // Verify state and time remain unchanged
    expect(result.current.state).toBe(CountdownState.IDLE);
    expect(result.current.totalSeconds).toBe(60); // Time remains as initial because restart is not dispatched
  });

  test("reset should not dispatch when state is RUNNING", () => {
    const { result } = renderHook(() => useCountdown(60));

    // Start the countdown to change state to RUNNING
    act(() => result.current.start());
    expect(result.current.state).toBe(CountdownState.RUNNING);

    // Attempt to reset while RUNNING
    act(() => result.current.reset());

    // Verify state and time remain unchanged
    expect(result.current.state).toBe(CountdownState.RUNNING);
    expect(result.current.totalSeconds).toBe(60);
  });
});
