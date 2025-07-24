# API Reference

This section covers the API of the **Timekeeper Countdown** library. It includes detailed documentation for the main class, types, utilities, and methods you can use to control your countdown timer.

## Core Concepts

The **Timekeeper Countdown** library is designed with a strong emphasis on clear state management, inspired by the concept of a finite-state machine (FSM). This allows the library to have well-defined states for the countdown timer, ensuring that every action performed on the timer is consistent and predictable.

### Finite-State Machine (FSM) Design

The timer operates in four core states:

- **IDLE**: The countdown timer is ready but not yet started. From this state, the timer can be started.
- **RUNNING**: The countdown is in progress. It can be paused or reset while in this state.
- **PAUSED**: The countdown has been temporarily stopped but can be resumed or reset.
- **COMPLETED**: The countdown has finished. The only valid action from this state is to reset or restart the timer.

### Why FSM Makes This Library Robust

1. **Error Prevention**: Actions are only valid when the timer is in the appropriate state, preventing common timing errors.
2. **Predictability**: State transitions are consistent and well-defined.
3. **Clear Interface**: Each action corresponds to a specific state transition.
4. **Scalability**: The FSM model can be easily extended for future features.

## TimekeeperCountdown Class

The `TimekeeperCountdown` class is the main API for creating and managing countdown timers.

### Constructor

```typescript
import { TimekeeperCountdown } from 'timekeeper-countdown'

const timer = new TimekeeperCountdown(initialSeconds, options?)
```

#### Parameters

- **initialSeconds** (`number`): The initial number of seconds for the countdown timer. Must be between 1 and 8,553,600 (99 days).
- **options** (`TimekeeperCountdownOptions`, optional): Configuration options for the timer.

#### Options

```typescript
interface TimekeeperCountdownOptions {
  onStart?: () => void
  onPause?: () => void
  onResume?: () => void
  onReset?: () => void
  onComplete?: () => void
  onTick?: (data: CountdownEventData) => void
  targetUpdateRate?: number // milliseconds between updates (default: 50)
}
```

### Methods

#### start()
Starts the countdown timer. Only valid when state is `IDLE` or after reset.

```typescript
timer.start()
```

#### pause()
Pauses the running countdown. Only valid when state is `RUNNING`.

```typescript
timer.pause()
```

#### resume()
Resumes a paused countdown. Only valid when state is `PAUSED`.

```typescript
timer.resume()
```

#### reset(newInitialSeconds?)
Resets the timer to initial state. Optionally accepts new initial seconds.

```typescript
timer.reset() // Reset to original initial seconds
timer.reset(1800) // Reset to 30 minutes
```

#### restart(newInitialSeconds?)
Convenience method that resets and immediately starts the timer.

```typescript
timer.restart() // Restart with original initial seconds
timer.restart(600) // Restart with 10 minutes
```

#### getState()
Returns the current state of the timer.

```typescript
const state = timer.getState() // 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED'
```

#### getTotalSeconds()
Returns the total seconds remaining in the countdown.

```typescript
const seconds = timer.getTotalSeconds()
```

#### getTime()
Returns the current time broken down into units.

```typescript
const time = timer.getTime()
// Returns: { days: number, hours: number, minutes: number, seconds: number, totalSeconds: number }
```

#### on(event, listener)
Adds an event listener for timer events.

```typescript
timer.on('tick', (data) => {
  console.log(`Time remaining: ${data.totalSeconds}`)
})
```

#### off(event, listener)
Removes an event listener.

```typescript
timer.off('tick', tickHandler)
```

#### destroy()
Cleans up the timer instance, removing all event listeners and stopping any active timers.

```typescript
timer.destroy()
```

## Event System

The timer emits various events during its lifecycle:

### Event Types

```typescript
type CountdownEventType = 
  | 'start'
  | 'pause'
  | 'resume'
  | 'reset'
  | 'complete'
  | 'tick'
```

### Event Data

All events receive a `CountdownEventData` object:

```typescript
interface CountdownEventData {
  state: CountdownStateType
  totalSeconds: number
  days: number
  hours: number
  minutes: number
  seconds: number
}
```

### Event Examples

```typescript
// Listen to multiple events
timer.on('start', () => console.log('Timer started!'))
timer.on('complete', () => console.log('Countdown finished!'))
timer.on('tick', (data) => {
  console.log(`${data.minutes}:${data.seconds.toString().padStart(2, '0')}`)
})
```

## Utility Functions

### Time Utilities

```typescript
import {
  getDays,
  getHours,
  getMinutes,
  getSeconds,
  getCountdownTime
} from 'timekeeper-countdown'

// Convert total seconds to time units
const totalSeconds = 3661
const days = getDays(totalSeconds) // 0
const hours = getHours(totalSeconds) // 1
const minutes = getMinutes(totalSeconds) // 1
const seconds = getSeconds(totalSeconds) // 1

// Get all units at once
const time = getCountdownTime(totalSeconds)
// { days: 0, hours: 1, minutes: 1, seconds: 1, totalSeconds: 3661 }
```

### Validation Utilities

```typescript
import { validateInitialSeconds } from 'timekeeper-countdown'

try {
  const validSeconds = validateInitialSeconds(3600) // Valid
  const invalid = validateInitialSeconds(-10) // Throws error
} catch (error) {
  console.error('Invalid initial seconds:', error.message)
}
```

## Constants

```typescript
import {
  MIN_SECONDS,        // 1
  MAX_SECONDS,        // 8553600 (99 days)
  SECONDS_IN_A_MINUTE,// 60
  SECONDS_IN_AN_HOUR, // 3600
  SECONDS_IN_A_DAY,   // 86400
  CountdownState      // State enum object
} from 'timekeeper-countdown'

// CountdownState object
const states = {
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED'
}
```

## TypeScript Types

### Core Types

```typescript
// Time representation
interface CountdownTime {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalSeconds: number
}

// State types
type CountdownStateType = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED'

// Event types
type CountdownEventType = 'start' | 'pause' | 'resume' | 'reset' | 'complete' | 'tick'

// Event data
interface CountdownEventData extends CountdownTime {
  state: CountdownStateType
}

// Event listener
type CountdownEventListener = (data: CountdownEventData) => void

// Constructor options
interface TimekeeperCountdownOptions {
  onStart?: () => void
  onPause?: () => void
  onResume?: () => void
  onReset?: () => void
  onComplete?: () => void
  onTick?: (data: CountdownEventData) => void
  targetUpdateRate?: number
}
```

## Example: Complete Timer Implementation

```typescript
import { TimekeeperCountdown, CountdownState } from 'timekeeper-countdown'

// Create a 5-minute timer
const timer = new TimekeeperCountdown(300, {
  onStart: () => console.log('Timer started'),
  onComplete: () => alert('Time is up!'),
  onTick: (data) => {
    document.getElementById('display').textContent = 
      `${data.minutes}:${data.seconds.toString().padStart(2, '0')}`
  }
})

// Button handlers with state-based logic
const startButton = document.getElementById('start')
const pauseButton = document.getElementById('pause')
const resetButton = document.getElementById('reset')

startButton.onclick = () => {
  if (timer.getState() === CountdownState.IDLE) {
    timer.start()
  } else if (timer.getState() === CountdownState.PAUSED) {
    timer.resume()
  }
}

pauseButton.onclick = () => {
  if (timer.getState() === CountdownState.RUNNING) {
    timer.pause()
  }
}

resetButton.onclick = () => timer.reset()

// Update button states based on timer state
timer.on('tick', (data) => {
  startButton.disabled = data.state === CountdownState.RUNNING
  pauseButton.disabled = data.state !== CountdownState.RUNNING
  resetButton.disabled = data.state === CountdownState.IDLE
})
```

## Error Handling

The library validates inputs and state transitions:

```typescript
try {
  const timer = new TimekeeperCountdown(-10) // Throws error
} catch (error) {
  console.error('Invalid seconds:', error.message)
}

// State-based errors are prevented by the FSM
const timer = new TimekeeperCountdown(60)
timer.pause() // No effect - timer is not running
timer.start() // Works
timer.pause() // Now it pauses
```

## Performance Considerations

- The timer uses high-precision timing with automatic adjustment for drift
- Default update rate is 50ms for smooth UI updates
- You can adjust `targetUpdateRate` in options for different performance needs
- The timer automatically cleans up resources when destroyed

## Browser Compatibility

The library works in all modern browsers and Node.js environments. It automatically detects and uses the appropriate timer functions (`setTimeout`/`clearTimeout`) for the environment.