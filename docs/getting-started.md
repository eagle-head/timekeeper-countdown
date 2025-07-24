# Getting Started

Welcome to the **Timekeeper Countdown** library! This guide will walk you through the process of getting the library installed and integrated into your project.

## Introduction

**Timekeeper Countdown** is a powerful yet simple countdown timer library for JavaScript and TypeScript. It's framework-agnostic, meaning it works with any JavaScript framework (React, Vue, Angular, Svelte) or vanilla JavaScript. The library offers easy-to-use functions to start, pause, reset, resume, and restart countdowns with support for time units like days, hours, minutes, and seconds.

If you're building a task timer, event countdown, or just need to keep track of time, this library is perfect for you!

## Installation

To install the library, use one of the following commands:

```bash
npm install timekeeper-countdown
```

```bash
yarn add timekeeper-countdown
```

```bash
pnpm add timekeeper-countdown
```

This will add the library to your project's dependencies.

## Basic Usage

Here's a simple example of how to use the countdown timer with vanilla JavaScript:

```javascript
import { TimekeeperCountdown, CountdownState } from 'timekeeper-countdown'

// Create a 1-hour countdown timer
const timer = new TimekeeperCountdown(3600, {
  onTick: (data) => {
    console.log(`Time remaining: ${data.hours}h ${data.minutes}m ${data.seconds}s`)
    
    // Update your UI here
    document.getElementById('display').textContent = 
      `${data.hours}:${data.minutes.toString().padStart(2, '0')}:${data.seconds.toString().padStart(2, '0')}`
  },
  onComplete: () => {
    console.log('Countdown finished!')
    alert('Time is up!')
  }
})

// Control the timer
document.getElementById('start').onclick = () => timer.start()
document.getElementById('pause').onclick = () => timer.pause()
document.getElementById('resume').onclick = () => timer.resume()
document.getElementById('reset').onclick = () => timer.reset()
```

## Framework Integration

The library is designed to be framework-agnostic, so you can easily integrate it with any framework:

### React Hook Example

```typescript
import { useEffect, useRef, useState } from 'react'
import { TimekeeperCountdown, CountdownState, CountdownTime } from 'timekeeper-countdown'

export function useCountdownTimer(initialSeconds: number) {
  const timerRef = useRef<TimekeeperCountdown | null>(null)
  const [time, setTime] = useState<CountdownTime>({ 
    days: 0, hours: 0, minutes: 0, seconds: initialSeconds, totalSeconds: initialSeconds 
  })
  const [state, setState] = useState<string>(CountdownState.IDLE)

  useEffect(() => {
    timerRef.current = new TimekeeperCountdown(initialSeconds, {
      onTick: (data) => {
        setTime(data)
        setState(data.state)
      },
      onComplete: (data) => {
        setTime(data)
        setState(data.state)
      }
    })

    return () => timerRef.current?.destroy()
  }, [initialSeconds])

  return {
    ...time,
    state,
    start: () => timerRef.current?.start(),
    pause: () => timerRef.current?.pause(),
    resume: () => timerRef.current?.resume(),
    reset: (newSeconds?: number) => timerRef.current?.reset(newSeconds)
  }
}

// Usage in component
const CountdownComponent = () => {
  const { days, hours, minutes, seconds, state, start, pause, reset } = useCountdownTimer(3600)

  return (
    <div>
      <h2>Countdown Timer</h2>
      <div>
        {days}d {hours}h {minutes}m {seconds}s
      </div>
      <div>State: {state}</div>
      <button onClick={start} disabled={state === CountdownState.RUNNING}>
        Start
      </button>
      <button onClick={pause} disabled={state !== CountdownState.RUNNING}>
        Pause
      </button>
      <button onClick={() => reset()}>Reset</button>
    </div>
  )
}
```

### Vue Composable Example

```typescript
import { ref, onUnmounted } from 'vue'
import { TimekeeperCountdown, CountdownState } from 'timekeeper-countdown'

export function useCountdown(initialSeconds: number) {
  const timer = ref<TimekeeperCountdown | null>(null)
  const time = ref({ days: 0, hours: 0, minutes: 0, seconds: initialSeconds, totalSeconds: initialSeconds })
  const state = ref(CountdownState.IDLE)

  timer.value = new TimekeeperCountdown(initialSeconds, {
    onTick: (data) => {
      time.value = data
      state.value = data.state
    }
  })

  onUnmounted(() => timer.value?.destroy())

  return {
    time,
    state,
    start: () => timer.value?.start(),
    pause: () => timer.value?.pause(),
    reset: () => timer.value?.reset()
  }
}
```

## Key Features

- **Framework Agnostic**: Works with any JavaScript framework or vanilla JS
- **TypeScript Support**: Full TypeScript definitions included
- **Finite State Machine**: Predictable state transitions and error prevention
- **High Precision**: Accurate timing with automatic drift correction
- **Event System**: Listen to timer events (start, pause, complete, tick, etc.)
- **Small Bundle Size**: ~3KB minified and gzipped
- **Zero Dependencies**: No external dependencies

## Core Concepts

### Timer States

The timer operates with four distinct states:

- **IDLE**: Ready to start
- **RUNNING**: Countdown in progress  
- **PAUSED**: Temporarily stopped
- **COMPLETED**: Countdown finished

### Timer Methods

- `start()`: Begin the countdown
- `pause()`: Temporarily stop the countdown
- `resume()`: Continue from paused state
- `reset(newSeconds?)`: Reset to initial time or new time
- `restart(newSeconds?)`: Reset and immediately start
- `state`: Get current timer state (getter)
- `totalSeconds`: Get remaining seconds (getter)
- `time`: Get time broken into units (getter)
- `destroy()`: Clean up the timer instance

## Next Steps

Once you're comfortable with the basics, you can explore the following sections:

- **[API Reference](api-reference.md)**: Complete documentation of all methods and options
- **[Examples](examples.md)**: Practical examples and code snippets
- **[Framework Integration Guides](react-integration.md)**: Detailed guides for React, Vue, Angular, and Svelte
- **[Advanced Usage](advanced-usage.md)**: Advanced patterns and techniques
- **[FAQ](faq.md)**: Common questions and troubleshooting

## Quick Start Templates

### HTML + JavaScript

```html
<!DOCTYPE html>
<html>
<head>
    <title>Countdown Timer</title>
</head>
<body>
    <div id="timer-display">05:00</div>
    <button id="start">Start</button>
    <button id="pause">Pause</button>
    <button id="reset">Reset</button>

    <script type="module">
        import { TimekeeperCountdown, CountdownState } from './node_modules/timekeeper-countdown/dist/index.js'
        
        const timer = new TimekeeperCountdown(300, { // 5 minutes
            onTick: (data) => {
                document.getElementById('timer-display').textContent = 
                    `${data.minutes.toString().padStart(2, '0')}:${data.seconds.toString().padStart(2, '0')}`
            }
        })

        document.getElementById('start').onclick = () => timer.start()
        document.getElementById('pause').onclick = () => timer.pause()
        document.getElementById('reset').onclick = () => timer.reset()
    </script>
</body>
</html>
```

### Node.js

```javascript
import { TimekeeperCountdown } from 'timekeeper-countdown'

const timer = new TimekeeperCountdown(10, {
  onTick: (data) => {
    console.log(`${data.totalSeconds} seconds remaining`)
  },
  onComplete: () => {
    console.log('Timer finished!')
    process.exit(0)
  }
})

timer.start()
```

## Browser and Environment Support

- **Browsers**: All modern browsers (Chrome, Firefox, Safari, Edge)
- **Node.js**: Version 16 and above
- **TypeScript**: Full type definitions included
- **Module Systems**: ESM and CommonJS support

The library automatically detects the environment and uses the appropriate timer functions, making it work seamlessly in both browser and Node.js environments.