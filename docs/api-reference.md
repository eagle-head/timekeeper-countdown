# API Reference

This section covers the API of the **Timekeeper Countdown** library. It includes detailed documentation for the hook, enumerations, and actions you can use to control your countdown timer.

## Concept and Differentiation

The **Timekeeper Countdown** library is designed with a strong emphasis on clear state management, inspired by the concept of a finite-state machine (FSM). This allows the library to have well-defined states for the countdown timer, ensuring that every action performed on the timer is consistent and predictable.

### What is a Finite-State Machine (FSM)?

A finite-state machine is a computational model used to design systems that can only be in one state at a time, and transition between states based on specific events or conditions. These states and transitions are well-defined and limited, making the behavior of the system more predictable and easier to manage.

In the context of a countdown timer, a finite-state machine defines states like "IDLE", "RUNNING", "PAUSED", and "COMPLETED". Each state dictates which actions are valid and what the next state should be based on the current action.

### How the Timekeeper Countdown Utilizes FSM Principles

The **Timekeeper Countdown** library leverages FSM principles by defining strict states that the countdown timer can be in. These states ensure that the timer behaves consistently across different scenarios, reducing the risk of invalid operations, such as pausing a timer that hasn’t started or resetting a completed timer without restarting it first.

### Defined States

The timer operates in four core states:

- **IDLE**: The countdown timer is ready but not yet started. From this state, the timer can be started.
- **RUNNING**: The countdown is in progress. It can be paused or reset while in this state.
- **PAUSED**: The countdown has been temporarily stopped but can be resumed or reset.
- **COMPLETED**: The countdown has finished. The only valid action from this state is to reset or restart the timer.

### Why This Makes the Library Unique

1. **Error Prevention**: By using clearly defined states, the **Timekeeper Countdown** library prevents common errors that can arise from improper timing logic. Actions are only valid when the timer is in the appropriate state, ensuring that the timer operates smoothly.

2. **Predictability**: State transitions are predictable and consistent. The timer behaves exactly as expected because it follows a strict FSM model. You know that when the timer is running, only certain actions like pause or reset are allowed.

3. **Clear and Simple Interface**: The library provides an intuitive API where each action corresponds to a state transition, making it easy for developers to control the countdown behavior without having to manage complex timing logic manually.

4. **Scalability**: As FSM models are easy to extend, the library can accommodate more complex features or states if needed in future updates, making it a flexible and scalable solution for countdown-related tasks.

By applying FSM principles, the **Timekeeper Countdown** offers a highly reliable, scalable, and predictable timer solution that ensures invalid actions are prevented and the countdown’s state is always clearly defined.

## useCountdown Hook

The `useCountdown` hook is the primary way to manage a countdown timer in your React components. It provides the following states and methods:

### Usage

```typescript
import { useCountdown } from "timekeeper-countdown";

const {
  totalSeconds,
  days,
  hours,
  minutes,
  seconds,
  start,
  pause,
  reset,
  state,
  restart,
  resume,
} = useCountdown(3600); // 1 hour in seconds
```

### Parameters

- **initialSeconds**: The initial number of seconds for the countdown timer. It accepts a number between 1 and the maximum allowable value (99 days).

### Returns

- **totalSeconds**: The total seconds remaining.
- **days, hours, minutes, seconds**: The time units separated for convenience.
- **start**: Starts the countdown.
- **pause**: Pauses the countdown.
- **reset**: Resets the countdown to its initial value or a new value if provided.
- **state**: The current state of the countdown (`IDLE`, `RUNNING`, `PAUSED`, or `COMPLETED`).
- **restart**: Restarts the countdown with the initial or a new value.
- **resume**: Resumes the countdown if it is paused.

### Example: State-Based Button Management

You can use the `CountdownState` enum to manage the availability of buttons in your component, disabling them when certain actions are not valid.

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
    state,
    restart,
    resume,
  } = useCountdown(3600); // 1 hour countdown

  return (
    <div>
      <h1>Countdown Timer</h1>
      <div>
        {days} Days {hours} Hours {minutes} Minutes {seconds} Seconds
      </div>

      {/* Disable buttons based on the current state */}
      <div>
        {/* Start button is disabled if the countdown is already running */}
        <button onClick={start} disabled={state === CountdownState.RUNNING}>
          Start
        </button>

        {/* Pause button is only enabled when the countdown is running */}
        <button onClick={pause} disabled={state !== CountdownState.RUNNING}>
          Pause
        </button>

        {/* Resume button is only enabled when the countdown is paused */}
        <button onClick={resume} disabled={state !== CountdownState.PAUSED}>
          Resume
        </button>

        {/* Reset button is disabled while the countdown is running */}
        <button
          onClick={() => reset()}
          disabled={state === CountdownState.RUNNING}
        >
          Reset
        </button>

        {/* Restart button is enabled in all states except IDLE */}
        <button
          onClick={() => restart()}
          disabled={state === CountdownState.IDLE}
        >
          Restart (same time)
        </button>

        {/* Restart with new time is enabled in all states except IDLE */}
        <button
          onClick={() => restart(30)}
          disabled={state === CountdownState.IDLE}
        >
          Restart (30 seconds)
        </button>
      </div>

      {/* Display the current state */}
      <div>Current state: {state}</div>
    </div>
  );
};

export default CountdownTimer;
```

This example shows how to prevent invalid actions by using `CountdownState` to disable buttons based on the current state of the countdown timer.

## CountdownState Enum

The `CountdownState` enumeration represents the different states the countdown can be in.

### States

- **IDLE**: The countdown has not started yet or has been reset.
- **RUNNING**: The countdown is currently in progress.
- **PAUSED**: The countdown is paused.
- **COMPLETED**: The countdown has completed.

Example:

```typescript
if (state === CountdownState.RUNNING) {
  // Perform an action while the countdown is running
}
```

## Actions

The following actions are dispatched to manage the countdown's internal state.

### Available Actions

- **START**: Start the countdown.
- **PAUSE**: Pause the countdown.
- **RESET**: Reset the countdown to its initial value.
- **TICK**: The internal action that runs every second to decrement the countdown.
- **COMPLETE**: Triggered when the countdown reaches zero.
- **RESTART**: Restart the countdown with the same or a new initial value.

```typescript
dispatch({ type: ActionTypes.START });
```

This structure provides the API reference with detailed information on the **useCountdown** hook, the **CountdownState** enum, and the **Actions** available.

Now, users can see how to properly utilize the `CountdownState` to manage UI elements like buttons based on the countdown’s current state.
