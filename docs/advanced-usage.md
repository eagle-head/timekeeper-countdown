# Advanced Usage

This section covers advanced techniques and strategies you can use with the **Timekeeper Countdown** library to extend its functionality beyond the basics.

## Custom Time Formats

The **Timekeeper Countdown** library allows you to display the remaining time in a variety of formats. By default, the library provides days, hours, minutes, and seconds as separate values, which you can combine in any way that fits your specific needs.

### Example: Displaying Time in HH:MM:SS

Here’s an example of how you can create a custom format to display time in hours, minutes, and seconds (HH:MM:SS):

```typescript
import React from "react";
import { useCountdown } from "timekeeper-countdown";

const CustomFormatTimer = () => {
  const { hours, minutes, seconds } = useCountdown(3600); // 1 hour in seconds

  return (
    <div>
      <h1>Custom Timer</h1>
      <h2>{`${hours}:${minutes}:${seconds}`}</h2>
    </div>
  );
};

export default CustomFormatTimer;
```

This flexibility allows you to format the countdown in whatever way suits your application, such as including or excluding days, or even breaking time down into more granular units like milliseconds.

### Example: Adding Days to the Display

For timers that span multiple days, you can also display the days portion of the countdown:

```typescript
import React from "react";
import { useCountdown } from "timekeeper-countdown";

const CustomDayFormatTimer = () => {
  const { days, hours, minutes, seconds } = useCountdown(86400 * 2); // 2 days in seconds

  return (
    <div>
      <h1>Multi-Day Timer</h1>
      <h2>{`${days} Days, ${hours} Hours, ${minutes} Minutes, ${seconds} Seconds`}</h2>
    </div>
  );
};

export default CustomDayFormatTimer;
```

## Handling Time Events

With the **Timekeeper Countdown** library, you can easily handle specific time events like when the countdown reaches zero or when a certain amount of time has passed.

### Example: Triggering an Action When the Countdown Completes

You can leverage the countdown's **COMPLETED** state to trigger custom actions when the countdown reaches zero.

```typescript
import React, { useEffect } from "react";
import { useCountdown, CountdownState } from "timekeeper-countdown";

const CountdownWithCompletion = () => {
  const { totalSeconds, state, start } = useCountdown(10); // 10 seconds

  useEffect(() => {
    if (state === CountdownState.COMPLETED) {
      alert("The countdown is complete!");
    }
  }, [state]);

  return (
    <div>
      <h1>Countdown Timer</h1>
      <h2>{totalSeconds} seconds remaining</h2>
      <button onClick={start}>Start Countdown</button>
    </div>
  );
};

export default CountdownWithCompletion;
```

In this example, the `useEffect` hook monitors the countdown's state. When the countdown transitions to the **COMPLETED** state, the custom action (`alert("The countdown is complete!")`) is triggered.

### Example: Pausing the Countdown After a Specific Duration

In some cases, you may want to pause or stop the countdown after a specific amount of time has passed. This can be achieved using a combination of `setTimeout` and the library's **pause** method.

```typescript
import React, { useEffect } from "react";
import { useCountdown, CountdownState } from "timekeeper-countdown";

const CountdownWithAutoPause = () => {
  const { totalSeconds, start, pause, state } = useCountdown(60); // 1 minute

  useEffect(() => {
    if (state === CountdownState.RUNNING) {
      const timerId = setTimeout(() => {
        pause();
        alert("The countdown has been paused after 30 seconds!");
      }, 30000); // Pause after 30 seconds

      return () => clearTimeout(timerId); // Clean up the timer when component unmounts or state changes
    }
  }, [state, pause]);

  return (
    <div>
      <h1>Auto-Pausing Countdown</h1>
      <h2>{totalSeconds} seconds remaining</h2>
      <button onClick={start}>Start Countdown</button>
    </div>
  );
};

export default CountdownWithAutoPause;
```

In this example, the countdown is automatically paused after 30 seconds, using `setTimeout` to trigger the pause action.

With these advanced usage examples, you can extend the functionality of the **Timekeeper Countdown** library to handle custom time formats and time-based events in your applications.
