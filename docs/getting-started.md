# Getting Started

> 🚀 **Framework Agnostic** - Works with Vanilla JS, React, Angular, Vue, Svelte, or any JavaScript framework

## Installation

```bash
npm install timekeeper-countdown
```

## Quick Start

### Basic Timer (5 minutes)

```javascript
import { Countdown } from 'timekeeper-countdown'

const timer = Countdown(300, {
  onUpdate: (minutes, seconds) => {
    console.log(`${minutes}:${seconds}`)
  },
})

timer.start()
```

### Complete Example

```javascript
import { Countdown, TimerState } from 'timekeeper-countdown'

// Create 10-minute countdown
const timer = Countdown(600, {
  onUpdate: (minutes, seconds) => {
    document.getElementById('display').textContent = `${minutes}:${seconds}`
  },
  onStateChange: state => {
    console.log(`Timer state: ${state}`)
  },
  debug: true, // Enable logging
})

// Control the timer
timer.start() // Begin countdown
timer.pause() // Pause timer
timer.resume() // Resume from pause
timer.reset() // Reset to initial time
timer.stop() // Stop and go to 0

// Get current values
console.log(timer.getMinutes()) // "10"
console.log(timer.getSeconds()) // "00"
console.log(timer.getCurrentState()) // "RUNNING"

// Cleanup when done
timer.destroy()
```

## Core Concepts

### Timer States

The timer has 4 possible states:

- `IDLE` - Initial state, ready to start
- `RUNNING` - Timer is counting down
- `PAUSED` - Timer is paused, can be resumed
- `STOPPED` - Timer has been stopped or completed

### Time Input

Always provide time in **seconds**:

```javascript
const timer1 = Countdown(60) // 1 minute
const timer2 = Countdown(300) // 5 minutes
const timer3 = Countdown(3600) // 1 hour
const timer4 = Countdown(86400) // 1 day
```

### Callbacks

Two main callbacks for reacting to timer changes:

```javascript
const timer = Countdown(300, {
  // Called every second with formatted time
  onUpdate: (minutes, seconds) => {
    updateUI(minutes, seconds)
  },

  // Called when timer state changes
  onStateChange: state => {
    handleStateChange(state)
  },
})
```

### Methods

Control your timer with these methods:

| Method      | Description           | When Available |
| ----------- | --------------------- | -------------- |
| `start()`   | Start the countdown   | When IDLE      |
| `pause()`   | Pause the timer       | When RUNNING   |
| `resume()`  | Resume from pause     | When PAUSED    |
| `reset()`   | Reset to initial time | Any state      |
| `stop()`    | Stop and set to 0     | Any state      |
| `destroy()` | Cleanup resources     | Any state      |

### Getting Values

Retrieve formatted time values:

```javascript
timer.getSeconds() // "05" - seconds part
timer.getMinutes() // "04" - minutes part
timer.getHours() // "02" - hours part
timer.getDays() // "01" - days part
timer.getWeeks() // "00" - weeks part
timer.getYears() // "00" - years part
```

## Memory Management

**⚠️ Always call `destroy()` when done:**

```javascript
// Vanilla JS
window.addEventListener('beforeunload', () => {
  timer.destroy()
})

// React
useEffect(() => {
  return () => timer.destroy()
}, [])

// Angular
ngOnDestroy() {
  timer.destroy()
}
```

## Error Handling

The library includes built-in validation:

```javascript
// These will throw errors
Countdown(-5) // Negative time
Countdown(1.5) // Non-integer
Countdown('300') // Non-number
Countdown(null) // Invalid type

// Safe usage
try {
  const timer = Countdown(300)
  timer.start()
} catch (error) {
  console.error('Timer error:', error.message)
}
```

## Next Steps

- [Framework Examples](./examples.md) - React, Angular, Vue, Svelte integrations
