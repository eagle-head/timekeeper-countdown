# Timekeeper Countdown ⏳

Ultra-lightweight, framework-agnostic countdown timer library. Pure TypeScript with zero dependencies.

## Why Timekeeper Countdown?

- 🪶 **Ultra-lightweight** - Only ~3KB minified + gzipped
- 🚀 **Zero Dependencies** - No external runtime dependencies
- 🎯 **TypeScript First** - Built with TypeScript, works with plain JavaScript
- 🔄 **State Machine** - Predictable state transitions (IDLE → RUNNING → PAUSED → STOPPED)
- ⚡ **Framework Agnostic** - Works with any framework or vanilla JS
- 📚 **Rich Documentation** - Complete integration guides for vanilla JS and React
- 🌳 **Tree-Shakable** - Import only what you need
- 📦 **Modern Formats** - ESM and CJS support

## Installation

```bash
npm install timekeeper-countdown
```

That's it! No peer dependencies, no framework requirements. Just install and use.

## Quick Start

### Vanilla JavaScript/TypeScript

```typescript
import { Countdown } from 'timekeeper-countdown'

// Create a 5-minute countdown
const countdown = Countdown(300, {
  onUpdate: (minutes, seconds) => {
    console.log(`${minutes}:${seconds}`)
  },
  onStateChange: (state) => {
    console.log(`State changed to: ${state}`)
  }
})

// Control the countdown
countdown.start()   // Start timer
countdown.pause()   // Pause timer  
countdown.resume()  // Resume from pause
countdown.reset()   // Reset to initial time
countdown.stop()    // Stop and set to 00:00
```

### Getting Time Values

```typescript
// All getter methods return formatted strings
countdown.getMinutes() // "05"
countdown.getSeconds() // "00"
countdown.getHours()   // "00"
countdown.getDays()    // "00"
countdown.getWeeks()   // "00"
countdown.getYears()   // "00"
countdown.getCurrentState() // "IDLE" | "RUNNING" | "PAUSED" | "STOPPED"
```

### Framework Integration

Since `timekeeper-countdown` is framework-agnostic, you can easily integrate it with any framework. Check out our complete examples in the [docs folder](./docs/):

- 📖 **[Getting Started Guide](docs/getting-started.md)** - Basic usage and concepts
- 📖 **[Framework Examples](docs/examples.md)** - React implementation and vanilla patterns

### Quick Implementation Examples

<details>
<summary><strong>React Hook Example</strong></summary>

```typescript
import { useState, useEffect, useRef } from 'react'
import { Countdown, TimerState } from 'timekeeper-countdown'

function useCountdown(initialSeconds) {
  const [time, setTime] = useState({ minutes: '00', seconds: '00' })
  const [state, setState] = useState(TimerState.IDLE)
  const countdownRef = useRef(null)

  useEffect(() => {
    countdownRef.current = Countdown(initialSeconds, {
      onUpdate: (minutes, seconds) => setTime({ minutes, seconds }),
      onStateChange: setState
    })

    return () => countdownRef.current?.destroy()
  }, [initialSeconds])

  return {
    time,
    state,
    start: () => countdownRef.current?.start(),
    pause: () => countdownRef.current?.pause(),
    resume: () => countdownRef.current?.resume(),
    reset: () => countdownRef.current?.reset(),
    stop: () => countdownRef.current?.stop()
  }
}

// Usage
function Timer() {
  const { time, state, start, pause, resume, reset } = useCountdown(300)
  
  return (
    <div>
      <div>{time.minutes}:{time.seconds}</div>
      <button onClick={start} disabled={state === TimerState.RUNNING}>Start</button>
      <button onClick={pause} disabled={state !== TimerState.RUNNING}>Pause</button>
      <button onClick={resume} disabled={state !== TimerState.PAUSED}>Resume</button>
      <button onClick={reset}>Reset</button>
    </div>
  )
}
```
</details>

## Core API

### Countdown Function

```typescript
import { Countdown } from 'timekeeper-countdown'

const countdown = Countdown(
  initialSeconds: number,
  options?: {
    onUpdate?: (minutes: string, seconds: string) => void
    onStateChange?: (state: TimerState) => void
    debug?: boolean
  }
)
```

### CountdownInstance Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `start()` | Start the countdown | `void` |
| `pause()` | Pause the countdown | `void` |
| `resume()` | Resume from paused state | `void` |
| `reset()` | Reset to initial time | `void` |
| `stop()` | Stop and set to 00:00 | `void` |
| `destroy()` | Clean up resources | `void` |

### Getter Methods

All getter methods return zero-padded strings:

| Method | Description | Example Return |
|--------|-------------|----------------|
| `getSeconds()` | Get seconds component (0-59) | `"05"` |
| `getMinutes()` | Get minutes component | `"04"` |
| `getHours()` | Get hours component | `"02"` |
| `getDays()` | Get days component | `"01"` |
| `getWeeks()` | Get weeks component | `"00"` |
| `getYears()` | Get years component | `"00"` |
| `getCurrentState()` | Get current state | `"RUNNING"` |

### Timer States

```typescript
export enum TimerState {
  IDLE = "IDLE",         // Initial state, ready to start
  RUNNING = "RUNNING",   // Countdown is active
  PAUSED = "PAUSED",     // Countdown is paused
  STOPPED = "STOPPED"    // Countdown completed or manually stopped
}
```

### State Machine

The countdown follows a predictable finite state machine:

```
IDLE ──start()──→ RUNNING ──pause()──→ PAUSED
 ↑                   │                    │
 │                   │                    │
 └──reset()──────────┴────────────────────┘
                     │
                     ↓
                  STOPPED
               (manual stop or
              timer completed)
```

## Advanced Usage

### Multiple Countdown Instances

```typescript
import { Countdown } from 'timekeeper-countdown'

// Create multiple independent countdowns
const workTimer = Countdown(25 * 60, { // 25 minutes
  onUpdate: (min, sec) => updateWorkDisplay(min, sec),
  onStateChange: (state) => {
    if (state === 'STOPPED') {
      console.log('Work session completed!')
      breakTimer.start()
    }
  }
})

const breakTimer = Countdown(5 * 60, { // 5 minutes
  onUpdate: (min, sec) => updateBreakDisplay(min, sec),
  onStateChange: (state) => {
    if (state === 'STOPPED') {
      console.log('Break time over!')
    }
  }
})

workTimer.start()
```

### With Debug Logging

```typescript
const countdown = Countdown(300, {
  debug: true, // Enable console logging
  onUpdate: (minutes, seconds) => {
    console.log(`Time: ${minutes}:${seconds}`)
  }
})
```

### Memory Management

Always call `destroy()` when you're done with a countdown to prevent memory leaks:

```typescript
// In vanilla JS
window.addEventListener('beforeunload', () => {
  countdown.destroy()
})

// In React
useEffect(() => {
  const countdown = Countdown(300, options)
  return () => countdown.destroy()
}, [])

// When using other frameworks, wrap `destroy()` in the respective lifecycle hook.
```

## TypeScript Support

This library is built with TypeScript and provides complete type definitions:

```typescript
import type { 
  CountdownOptions,
  CountdownInstance,
  TimerState
} from 'timekeeper-countdown'
```

## Browser Support

- **Modern Browsers** - ES2020+ (Chrome 80+, Firefox 72+, Safari 13.1+)
- **Node.js** - Version 16+

For older browser support, use a bundler with appropriate polyfills.

## Examples & Demos

Check out the complete working examples:

- **[Getting Started](docs/getting-started.md)** - Installation and basic usage
- **[Framework Examples](docs/examples.md)** - React implementation and vanilla patterns

## Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

## License

MIT © [Eduardo Kohn](https://www.linkedin.com/in/eduardo-kohn-56817b195/)

---

<div align="center">

**[📖 Documentation](docs/getting-started.md)** • **[📖 Examples](docs/examples.md)**

</div>
