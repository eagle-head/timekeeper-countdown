# Examples

This section provides practical examples of how to use the **Timekeeper Countdown** library. The examples cover basic, advanced, and framework integration use cases, demonstrating the flexibility of the library.

## Available Examples

- **Vanilla JavaScript**: Complete HTML example showing core library usage (`examples/vanilla/basic.html`)
- **Framework Integrations**: TypeScript examples for React, Vue, Angular, and Svelte using the TimekeeperCountdown class (`examples/integrations/`)

## File Structure

```
examples/
├── integrations/           # Framework integration examples
│   ├── react.ts           # React class implementation
│   ├── vue.ts             # Vue composable implementation  
│   ├── angular.ts         # Angular service implementation
│   └── svelte.ts          # Svelte store implementation
└── vanilla/               # Pure JavaScript/HTML examples
    └── basic.html         # Complete working HTML example
```

Each integration file in `examples/integrations/` provides a complete, ready-to-use implementation for the respective framework using the TimekeeperCountdown class, along with usage examples and TypeScript definitions.

## Basic Vanilla JavaScript Example

The simplest way to use the library with plain JavaScript:

```javascript
import { TimekeeperCountdown, CountdownState } from 'timekeeper-countdown'

// Create a 60-second timer
const timer = new TimekeeperCountdown(60, {
  onTick: (data) => {
    document.getElementById('display').textContent = 
      `${data.minutes}:${data.seconds.toString().padStart(2, '0')}`
  },
  onComplete: () => {
    alert('Time is up!')
  }
})

// Button handlers
document.getElementById('start').onclick = () => {
  if (timer.state === CountdownState.IDLE) {
    timer.start()
  } else if (timer.state === CountdownState.PAUSED) {
    timer.resume()
  }
}

document.getElementById('pause').onclick = () => {
  if (timer.state === CountdownState.RUNNING) {
    timer.pause()
  }
}

document.getElementById('reset').onclick = () => timer.reset()
```

## React Class Example

Here's how to use the TimekeeperCountdown class directly in React components:

```typescript
import { useEffect, useState } from 'react'
import { TimekeeperCountdown, CountdownState, CountdownTime } from 'timekeeper-countdown'

const CountdownComponent = () => {
  // Create timer instance using useState
  const [timer] = useState(() => new TimekeeperCountdown(3600)) // 1 hour
  const [time, setTime] = useState<CountdownTime>({
    days: 0, hours: 1, minutes: 0, seconds: 0, totalSeconds: 3600
  })
  const [state, setState] = useState<string>(CountdownState.IDLE)

  useEffect(() => {
    // Set up event handlers
    timer.onTick = (data) => {
      setTime(data)
      setState(data.state)
    }
    timer.onStart = () => setState(CountdownState.RUNNING)
    timer.onPause = () => setState(CountdownState.PAUSED)
    timer.onResume = () => setState(CountdownState.RUNNING)
    timer.onReset = (data) => {
      setTime(data)
      setState(data.state)
    }
    timer.onComplete = (data) => {
      setTime(data)
      setState(data.state)
    }

    // Cleanup on unmount
    return () => {
      timer.destroy()
    }
  }, [])

  const handleStart = () => {
    if (timer.state === CountdownState.IDLE || timer.state === CountdownState.PAUSED) {
      timer.start()
    }
  }

  const handlePause = () => {
    if (timer.state === CountdownState.RUNNING) {
      timer.pause()
    }
  }

  const handleReset = () => {
    timer.reset()
  }

  return (
    <div>
      <h1>Countdown Timer</h1>
      <div>
        {time.days}d {time.hours}h {time.minutes}m {time.seconds}s
      </div>
      <div>State: {state}</div>
      <button onClick={handleStart} disabled={state === CountdownState.RUNNING}>
        {state === CountdownState.PAUSED ? 'Resume' : 'Start'}
      </button>
      <button onClick={handlePause} disabled={state !== CountdownState.RUNNING}>
        Pause
      </button>
      <button onClick={handleReset}>Reset</button>
    </div>
  )
}

// Alternative: Using a custom hook wrapper (optional)
export function useTimekeeperCountdown(initialSeconds: number) {
  const [timer] = useState(() => new TimekeeperCountdown(initialSeconds))
  const [time, setTime] = useState<CountdownTime>({
    days: 0, hours: 0, minutes: 0, seconds: initialSeconds, totalSeconds: initialSeconds
  })
  const [state, setState] = useState<string>(CountdownState.IDLE)

  useEffect(() => {
    timer.onTick = (data) => {
      setTime(data)
      setState(data.state)
    }
    timer.onStart = () => setState(CountdownState.RUNNING)
    timer.onPause = () => setState(CountdownState.PAUSED)
    timer.onResume = () => setState(CountdownState.RUNNING)
    timer.onReset = (data) => {
      setTime(data)
      setState(data.state)
    }
    timer.onComplete = (data) => {
      setTime(data)
      setState(data.state)
    }

    return () => timer.destroy()
  }, [])

  return {
    timer,
    time,
    state,
    start: () => timer.start(),
    pause: () => timer.pause(),
    resume: () => timer.resume(),
    reset: (newSeconds?: number) => timer.reset(newSeconds),
    restart: (newSeconds?: number) => timer.restart(newSeconds)
  }
}
```

## Vue Composable Example

Here's a Vue composable implementation using the TimekeeperCountdown class:

```typescript
import { ref, onUnmounted } from 'vue'
import { TimekeeperCountdown, CountdownState, CountdownTime } from 'timekeeper-countdown'

export function useTimekeeperCountdown(initialSeconds: number) {
  const timer = new TimekeeperCountdown(initialSeconds)
  const time = ref<CountdownTime>({ 
    days: 0, hours: 0, minutes: 0, seconds: initialSeconds, totalSeconds: initialSeconds 
  })
  const state = ref<string>(CountdownState.IDLE)

  // Set up event handlers
  timer.onTick = (data) => {
    time.value = data
    state.value = data.state
  }
  timer.onStart = () => state.value = CountdownState.RUNNING
  timer.onPause = () => state.value = CountdownState.PAUSED
  timer.onResume = () => state.value = CountdownState.RUNNING
  timer.onReset = (data) => {
    time.value = data
    state.value = data.state
  }
  timer.onComplete = (data) => {
    time.value = data
    state.value = data.state
  }

  const start = () => timer.start()
  const pause = () => timer.pause()
  const resume = () => timer.resume()
  const reset = (newSeconds?: number) => timer.reset(newSeconds)
  const restart = (newSeconds?: number) => timer.restart(newSeconds)

  onUnmounted(() => {
    timer.destroy()
  })

  return {
    timer,
    time,
    state,
    start,
    pause,
    resume,
    reset,
    restart
  }
}

// Usage in Vue component
// <script setup>
// const { timer, time, state, start, pause, reset } = useTimekeeperCountdown(3600)
// </script>
```

## Advanced Example: Multi-Timer Dashboard

A more complex example showing multiple timers:

```typescript
import { TimekeeperCountdown, CountdownState } from 'timekeeper-countdown'

class TimerDashboard {
  private timers: Map<string, TimekeeperCountdown> = new Map()
  private displays: Map<string, HTMLElement> = new Map()

  addTimer(id: string, seconds: number, displayElement: HTMLElement) {
    const timer = new TimekeeperCountdown(seconds, {
      onTick: (data) => {
        displayElement.textContent = this.formatTime(data)
      },
      onComplete: () => {
        displayElement.classList.add('completed')
        console.log(`Timer ${id} completed!`)
      }
    })

    this.timers.set(id, timer)
    this.displays.set(id, displayElement)
  }

  private formatTime(data: any): string {
    if (data.days > 0) {
      return `${data.days}d ${data.hours}h ${data.minutes}m ${data.seconds}s`
    } else if (data.hours > 0) {
      return `${data.hours}:${data.minutes.toString().padStart(2, '0')}:${data.seconds.toString().padStart(2, '0')}`
    } else {
      return `${data.minutes}:${data.seconds.toString().padStart(2, '0')}`
    }
  }

  startTimer(id: string) {
    this.timers.get(id)?.start()
  }

  pauseTimer(id: string) {
    this.timers.get(id)?.pause()
  }

  resetTimer(id: string, newSeconds?: number) {
    const display = this.displays.get(id)
    display?.classList.remove('completed')
    this.timers.get(id)?.reset(newSeconds)
  }

  startAll() {
    this.timers.forEach(timer => {
      if (timer.state === CountdownState.IDLE) {
        timer.start()
      }
    })
  }

  pauseAll() {
    this.timers.forEach(timer => {
      if (timer.state === CountdownState.RUNNING) {
        timer.pause()
      }
    })
  }

  destroy() {
    this.timers.forEach(timer => timer.destroy())
    this.timers.clear()
    this.displays.clear()
  }
}

// Usage
const dashboard = new TimerDashboard()
dashboard.addTimer('pomodoro', 1500, document.getElementById('pomodoro-display')!) // 25 minutes
dashboard.addTimer('break', 300, document.getElementById('break-display')!) // 5 minutes
dashboard.addTimer('lunch', 3600, document.getElementById('lunch-display')!) // 1 hour
```

## Framework Integration Examples

For detailed framework-specific examples, see the integration guides:

- **React**: See [React Integration Guide](react-integration.md) for class integration and component examples
- **Vue**: See [Vue Integration Guide](vue-integration.md) for composables and component examples  
- **Angular**: See [Angular Integration Guide](angular-integration.md) for service and component examples
- **Svelte**: See [Svelte Integration Guide](svelte-integration.md) for store and component examples

Each integration file in `examples/integrations/` provides the core TimekeeperCountdown class integration logic that can be copied directly into your project.

## Error Handling in Examples

All examples should include proper error handling:

```typescript
try {
  const timer = new TimekeeperCountdown(initialSeconds, options)
  // ... use timer
} catch (error) {
  console.error('Failed to create timer:', error.message)
  // Handle invalid initial seconds or other initialization errors
}

// Always clean up timers
window.addEventListener('beforeunload', () => {
  timer.destroy()
})
```

## Performance Tips

- The library uses optimized internal timing for smooth updates
- Always call `destroy()` when components unmount to prevent memory leaks
- Consider using a single timer for multiple displays instead of multiple timers when possible
- For high-frequency updates, batch DOM updates using `requestAnimationFrame`