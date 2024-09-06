# `timekeeper-countdown` ⏳

## General Description

The `timekeeper-countdown` hook is a powerful tool for creating and managing countdown timers in React components. It allows for easy control over countdown timers, with functions to start, pause, reset, resume, restart, and format the remaining time. This makes it ideal for use cases like countdown timers in games, event countdowns, stopwatch applications, and more.

## Installation

You can install the `timekeeper-countdown` hook using npm or yarn:

```bash
npm install timekeeper-countdown
```

or

```bash
yarn add timekeeper-countdown
```

## Usage Example

```typescript
import React from "react";
import { useCountdown, CountdownState } from "timekeeper-countdown";

const CountdownTimer = () => {
  const {
    totalSeconds,
    days,
    hours,
    minutes,
    seconds,
    start,
    pause,
    reset,
    resume,
    restart,
    state,
  } = useCountdown(3 * 24 * 60 * 60); // 3 days countdown

  return (
    <div>
      <h1>Countdown Timer</h1>

      <div>
        <div>Days: {days}</div>
        <div>Hours: {hours}</div>
        <div>Minutes: {minutes}</div>
        <div>Seconds: {seconds}</div>
        <div>Total Seconds: {totalSeconds}</div>
      </div>

      <div>
        <button onClick={start} disabled={state !== CountdownState.IDLE}>
          Start
        </button>
        <button onClick={pause} disabled={state !== CountdownState.RUNNING}>
          Pause
        </button>
        <button onClick={() => reset()} disabled={state === CountdownState.RUNNING}>
          Reset
        </button>
        <button onClick={() => reset(2 * 24 * 60 * 60)} disabled={state === CountdownState.RUNNING}>
          Reset to 2 Days
        </button>
        <button onClick={resume} disabled={state !== CountdownState.PAUSED}>
          Resume
        </button>
        <button onClick={() => restart()} disabled={state === CountdownState.IDLE}>
          Restart
        </button>
        <button onClick={() => restart(1 * 24 * 60 * 60)} disabled={state === CountdownState.IDLE}>
          Restart to 1 Day
        </button>
      </div>

      <div>Current State: {state}</div>
    </div>
  );
};

export default CountdownTimer;
```

## Hook API

The hook returns the current time and functions to control the countdown.

```typescript
const { time, start, pause, reset, resume, restart, state } = useCountdown(initialSeconds: number);
```

### Parameters

- **initialSeconds**: The initial number of seconds for the timer. Must be between 1 and 5940 (99 minutes).

### Returns

- **time**: The current time of the countdown formatted as a string in `"MM:SS"` format.
- **start**: Starts the countdown timer.
- **pause**: Pauses the countdown timer.
- **reset**: Resets the timer to the initial seconds or to a new value if provided.
- **resume**: Resumes the countdown from a paused state.
- **restart**: Restarts the countdown timer with the same or a new time.
- **state**: The current state of the countdown, which can be one of `CountdownState` (`IDLE`, `RUNNING`, `PAUSED`, `COMPLETED`).

## Timer States

The `CountdownState` enumeration includes four possible states:

- **IDLE**: Timer is ready to start or has been reset.
- **RUNNING**: Timer is currently counting down.
- **PAUSED**: Timer is paused.
- **COMPLETED**: Timer has finished counting down.

### Example of State and Action Transitions

- **START**: Begins the countdown.
- **PAUSE**: Pauses the countdown.
- **RESET**: Resets the countdown to its initial state or a new value.
- **RESUME**: Resumes the countdown from where it was paused.
- **TICK**: The internal action to decrement the countdown time.
- **COMPLETE**: Marks the countdown as completed when the timer reaches 0.
- **RESTART**: Restarts the timer from its initial or new value.

## Advanced Usage

### Handling Custom Time Formats

To display the time in a different format (like including hours or days), the hook provides additional helpers that return days, hours, minutes, and seconds.

```typescript
const { totalSeconds, days, hours, minutes, seconds } = useCountdown(3600); // 1 hour countdown
```

These helper functions can be used to format the time in any way you need.

### Customizing the Countdown Behavior

You can restart the countdown with a different initial time or reset the countdown without restarting it. Here's an example of how to use the `reset` and `restart` functions:

```typescript
<button onClick={() => restart(120)}>Restart (2 minutes)</button>
<button onClick={() => reset(45)}>Reset (45 seconds)</button>
```

## Validating Input

The hook automatically validates the input to ensure that the provided time is within acceptable limits:

- **MIN_SECONDS**: 1 second
- **MAX_SECONDS**: 99 days (8,553,600 seconds)

If the input is outside of these bounds, it will automatically be adjusted.

## Internals

The countdown hook relies on `useImmerReducer` to manage state transitions and the `setInterval` method to tick the timer every second. The interval is cleared when the countdown reaches 0, when the timer is paused, or when the component is unmounted.

## Frequently Asked Questions

### How do I change the initial time after starting the countdown?

You can use the `restart` or `reset` function with a new value to change the countdown's initial time.

### What happens if the countdown reaches 0?

When the countdown reaches 0, the timer automatically stops, and the state is set to `COMPLETED`.

### Can I use this hook with React Native?

Yes, this hook is compatible with both React and React Native environments.

---

For more details and the full documentation, visit the [repository](https://github.com/eagle-head/timekeeper-countdown).
