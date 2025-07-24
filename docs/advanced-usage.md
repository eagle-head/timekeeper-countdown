# Advanced Usage

This section covers advanced techniques and strategies you can use with the **Timekeeper Countdown** library to extend its functionality beyond the basics.

## Custom Time Formats

The **Timekeeper Countdown** library allows you to display the remaining time in a variety of formats. By default, the library provides days, hours, minutes, and seconds as separate values, which you can combine in any way that fits your specific needs.

### Example: Displaying Time in HH:MM:SS

Here’s an example of how you can create a custom format to display time in hours, minutes, and seconds (HH:MM:SS):

```typescript
import React, { useState, useEffect } from "react";
import { TimekeeperCountdown } from "timekeeper-countdown";

const CustomFormatTimer = () => {
  const [timer] = useState(() => new TimekeeperCountdown(3600)); // 1 hour in seconds
  const [timeData, setTimeData] = useState({
    hours: timer.hours,
    minutes: timer.minutes,
    seconds: timer.seconds
  });

  useEffect(() => {
    const updateTimer = () => {
      setTimeData({
        hours: timer.hours,
        minutes: timer.minutes,
        seconds: timer.seconds
      });
    };

    timer.on('tick', updateTimer);
    return () => timer.off('tick', updateTimer);
  }, [timer]);

  return (
    <div>
      <h1>Custom Timer</h1>
      <h2>{`${timeData.hours}:${timeData.minutes}:${timeData.seconds}`}</h2>
    </div>
  );
};

export default CustomFormatTimer;
```

This flexibility allows you to format the countdown in whatever way suits your application, such as including or excluding days, or even breaking time down into more granular units like milliseconds.

### Example: Adding Days to the Display

For timers that span multiple days, you can also display the days portion of the countdown:

```typescript
import React, { useState, useEffect } from "react";
import { TimekeeperCountdown } from "timekeeper-countdown";

const CustomDayFormatTimer = () => {
  const [timer] = useState(() => new TimekeeperCountdown(86400 * 2)); // 2 days in seconds
  const [timeData, setTimeData] = useState({
    days: timer.days,
    hours: timer.hours,
    minutes: timer.minutes,
    seconds: timer.seconds
  });

  useEffect(() => {
    const updateTimer = () => {
      setTimeData({
        days: timer.days,
        hours: timer.hours,
        minutes: timer.minutes,
        seconds: timer.seconds
      });
    };

    timer.on('tick', updateTimer);
    return () => timer.off('tick', updateTimer);
  }, [timer]);

  return (
    <div>
      <h1>Multi-Day Timer</h1>
      <h2>{`${timeData.days} Days, ${timeData.hours} Hours, ${timeData.minutes} Minutes, ${timeData.seconds} Seconds`}</h2>
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
import React, { useState, useEffect } from "react";
import { TimekeeperCountdown, CountdownState } from "timekeeper-countdown";

const CountdownWithCompletion = () => {
  const [timer] = useState(() => new TimekeeperCountdown(10)); // 10 seconds
  const [totalSeconds, setTotalSeconds] = useState(timer.totalSeconds);
  const [state, setState] = useState(timer.state);

  useEffect(() => {
    const updateTimer = () => {
      setTotalSeconds(timer.totalSeconds);
      setState(timer.state);
    };

    const handleCompletion = () => {
      alert("The countdown is complete!");
    };

    timer.on('tick', updateTimer);
    timer.on('complete', handleCompletion);
    
    return () => {
      timer.off('tick', updateTimer);
      timer.off('complete', handleCompletion);
    };
  }, [timer]);

  const handleStart = () => {
    timer.start();
  };

  return (
    <div>
      <h1>Countdown Timer</h1>
      <h2>{totalSeconds} seconds remaining</h2>
      <button onClick={handleStart}>Start Countdown</button>
    </div>
  );
};

export default CountdownWithCompletion;
```

In this example, we use event listeners to monitor the countdown's state. When the countdown completes, the 'complete' event is triggered, which executes the custom action (`alert("The countdown is complete!")`).

### Example: Pausing the Countdown After a Specific Duration

In some cases, you may want to pause or stop the countdown after a specific amount of time has passed. This can be achieved using a combination of `setTimeout` and the library's **pause** method.

```typescript
import React, { useState, useEffect } from "react";
import { TimekeeperCountdown, CountdownState } from "timekeeper-countdown";

const CountdownWithAutoPause = () => {
  const [timer] = useState(() => new TimekeeperCountdown(60)); // 1 minute
  const [totalSeconds, setTotalSeconds] = useState(timer.totalSeconds);
  const [state, setState] = useState(timer.state);

  useEffect(() => {
    const updateTimer = () => {
      setTotalSeconds(timer.totalSeconds);
      setState(timer.state);
    };

    timer.on('tick', updateTimer);
    return () => timer.off('tick', updateTimer);
  }, [timer]);

  useEffect(() => {
    if (state === CountdownState.RUNNING) {
      const timerId = setTimeout(() => {
        timer.pause();
        alert("The countdown has been paused after 30 seconds!");
      }, 30000); // Pause after 30 seconds

      return () => clearTimeout(timerId); // Clean up the timer when component unmounts or state changes
    }
  }, [state, timer]);

  const handleStart = () => {
    timer.start();
  };

  return (
    <div>
      <h1>Auto-Pausing Countdown</h1>
      <h2>{totalSeconds} seconds remaining</h2>
      <button onClick={handleStart}>Start Countdown</button>
    </div>
  );
};

export default CountdownWithAutoPause;
```

In this example, the countdown is automatically paused after 30 seconds, using `setTimeout` to trigger the `timer.pause()` method.

With these advanced usage examples, you can extend the functionality of the **Timekeeper Countdown** library to handle custom time formats and time-based events in your applications.
