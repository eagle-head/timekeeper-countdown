# Getting Started

Welcome to the **Timekeeper Countdown** library! This guide will walk you through the process of getting the library installed and integrated into your project.

## Introduction

**Timekeeper Countdown** is a powerful yet simple countdown timer library for React and React Native. It offers easy-to-use functions to start, pause, reset, resume, and restart countdowns with support for time units like days, hours, minutes, and seconds.

If you're building a task timer, event countdown, or just need to keep track of time, this library is perfect for you!

## Installation

To install the library, use one of the following commands:

```bash
npm install timekeeper-countdown
```

This will add the library to your project's dependencies.

## Basic Usage

Here’s a simple example of how to use the countdown timer in your React component:

```typescript
import { useCountdown } from "timekeeper-countdown";

const CountdownTimer = () => {
  const { days, hours, minutes, seconds, start, pause, reset } =
    useCountdown(3600); // 1 hour countdown

  return (
    <div>
      <h1>Countdown Timer</h1>
      <div>
        {days} Days {hours} Hours {minutes} Minutes {seconds} Seconds
      </div>
      <button onClick={start}>Start</button>
      <button onClick={pause}>Pause</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
};
```

In this example, we initialize the timer with `3600` seconds (1 hour), and the user can start, pause, or reset the countdown.

## Next Steps

Once you're comfortable with the basics, you can explore the following sections:

- [API Reference](api-reference.md#api-reference): Learn more about the available functions, such as `useCountdown`.
- [Advanced Usage](advanced-usage.md#advanced-usage): Discover how to customize time formats or handle time events.
- [Examples](examples.md#examples): Check out different configurations and use cases for the library.

### Key Sections:

- **Introduction**: Introduces the library's purpose and its core functionality.
- **Installation**: Shows how to install the library using either npm or yarn.
- **Basic Usage**: Provides a simple example of how to use the library in a React component.
- **Next Steps**: Points users to other parts of the documentation to deepen their understanding of the library.

This structure will allow smooth navigation from the sidebar, with each section on the same page.
