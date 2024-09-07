# Examples

This section provides practical examples of how to use the **Timekeeper Countdown** library. The examples cover basic, advanced, and custom use cases, demonstrating the flexibility of the library.

## Basic Countdown

A simple countdown timer starting from a specified number of seconds. It covers the basic functions like starting, pausing, and resetting the countdown.

### Key Features:

- Initialize the countdown with a specific time.
- Basic control buttons: Start, Pause, Reset.

### Code Example:

```typescript
import React from "react";
import { useCountdown } from "timekeeper-countdown";

const BasicCountdown = () => {
  const { seconds, start, pause, reset, state } = useCountdown(60);

  return (
    <div>
      <h1>Basic Countdown</h1>
      <div>Seconds: {seconds}</div>
      <div>State: {state}</div>
      <button onClick={start}>Start</button>
      <button onClick={pause}>Pause</button>
      <button onClick={() => reset()}>Reset</button>
    </div>
  );
};

export default BasicCountdown;
```

## Advanced Countdown

This example demonstrates a more advanced countdown timer that includes days, hours, minutes, and seconds. It also introduces how to handle countdown completion events.

### Key Features:

- Countdown formatted in days, hours, minutes, and seconds.
- Handling timer completion with custom logic (e.g., displaying an alert).
- Ability to reset the countdown to a different time dynamically.

### Code Example:

```typescript
import React, { useEffect } from "react";
import { useCountdown, CountdownState } from "timekeeper-countdown";

const AdvancedCountdown = () => {
  const { days, hours, minutes, seconds, start, pause, reset, state } =
    useCountdown(5 * 24 * 3600); // 5 days

  useEffect(() => {
    if (state === CountdownState.COMPLETED) {
      alert("Countdown completed!");
    }
  }, [state]);

  return (
    <div>
      <h1>Advanced Countdown</h1>
      <div>
        Time Remaining: {days} Days {hours} Hours {minutes} Minutes {seconds}{" "}
        Seconds
      </div>
      <div>State: {state}</div>
      <button onClick={start}>Start</button>
      <button onClick={pause}>Pause</button>
      <button onClick={() => reset(60)}>Reset to 60 seconds</button>
    </div>
  );
};

export default AdvancedCountdown;
```

## Custom Reset and Restart

An example focused on customizing the behavior of the reset and restart actions, allowing the user to reset or restart the countdown with new values.

### Key Features:

- Customize the reset and restart behavior with user-defined initial times.
- Control countdown state programmatically to fit specific use cases.

### Code Example:

```typescript
import React from "react";
import { useCountdown } from "timekeeper-countdown";

const CustomResetRestart = () => {
  const { seconds, start, pause, reset, restart, state } = useCountdown(120);

  return (
    <div>
      <h1>Custom Reset and Restart</h1>
      <div>Seconds: {seconds}</div>
      <div>State: {state}</div>
      <button onClick={start}>Start</button>
      <button onClick={pause}>Pause</button>
      <button onClick={() => reset(90)}>Reset to 90 seconds</button>
      <button onClick={() => restart(150)}>Restart with 150 seconds</button>
    </div>
  );
};

export default CustomResetRestart;
```
