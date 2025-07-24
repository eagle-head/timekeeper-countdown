# Examples

This section provides practical examples of how to use the **Timekeeper Countdown** library. The examples cover basic, advanced, and framework integration use cases, demonstrating the flexibility of the library.

## Available Examples

- **Vanilla JavaScript**: Complete HTML example showing core library usage (`examples/vanilla/basic.html`)
- **Framework Integrations**: TypeScript examples for React, Vue, Angular, and Svelte (`examples/integrations/`)

## File Structure

```
examples/
├── integrations/           # Framework integration examples
│   ├── react.ts           # React hook implementation
│   ├── vue.ts             # Vue composable implementation  
│   ├── angular.ts         # Angular service implementation
│   └── svelte.ts          # Svelte store implementation
└── vanilla/               # Pure JavaScript/HTML examples
    └── basic.html         # Complete working HTML example
```

Each integration file in `examples/integrations/` provides a complete, ready-to-use implementation for the respective framework, along with usage examples and TypeScript definitions.

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

## React Hook Example

Here's how you might create a React hook using the library:

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
      onStart: () => setState(CountdownState.RUNNING),
      onPause: () => setState(CountdownState.PAUSED),
      onResume: () => setState(CountdownState.RUNNING),
      onReset: (data) => {
        setTime(data)
        setState(data.state)
      },
      onComplete: (data) => {
        setTime(data)
        setState(data.state)
      }
    })

    return () => {
      timerRef.current?.destroy()
    }
  }, [initialSeconds])

  const start = () => timerRef.current?.start()
  const pause = () => timerRef.current?.pause()
  const resume = () => timerRef.current?.resume()
  const reset = (newSeconds?: number) => timerRef.current?.reset(newSeconds)
  const restart = (newSeconds?: number) => timerRef.current?.restart(newSeconds)

  return {
    ...time,
    state,
    start,
    pause,
    resume,
    reset,
    restart
  }
}

// Usage in component
const CountdownComponent = () => {
  const { days, hours, minutes, seconds, state, start, pause, reset } = useCountdownTimer(3600)

  return (
    <div>
      <h1>Countdown Timer</h1>
      <div>
        {days}d {hours}h {minutes}m {seconds}s
      </div>
      <div>State: {state}</div>
      <button onClick={start} disabled={state === CountdownState.RUNNING}>
        {state === CountdownState.PAUSED ? 'Resume' : 'Start'}
      </button>
      <button onClick={pause} disabled={state !== CountdownState.RUNNING}>
        Pause
      </button>
      <button onClick={() => reset()}>Reset</button>
    </div>
  )
}
```

## Vue Composable Example

Here's a Vue composable implementation:

```typescript
import { ref, onUnmounted } from 'vue'
import { TimekeeperCountdown, CountdownState, CountdownTime } from 'timekeeper-countdown'

export function useCountdown(initialSeconds: number) {
  const timer = ref<TimekeeperCountdown | null>(null)
  const time = ref<CountdownTime>({ 
    days: 0, hours: 0, minutes: 0, seconds: initialSeconds, totalSeconds: initialSeconds 
  })
  const state = ref<string>(CountdownState.IDLE)

  // Initialize timer
  timer.value = new TimekeeperCountdown(initialSeconds, {
    onTick: (data) => {
      time.value = data
      state.value = data.state
    },
    onStart: () => state.value = CountdownState.RUNNING,
    onPause: () => state.value = CountdownState.PAUSED,
    onResume: () => state.value = CountdownState.RUNNING,
    onReset: (data) => {
      time.value = data
      state.value = data.state
    },
    onComplete: (data) => {
      time.value = data
      state.value = data.state
    }
  })

  const start = () => timer.value?.start()
  const pause = () => timer.value?.pause()
  const resume = () => timer.value?.resume()
  const reset = (newSeconds?: number) => timer.value?.reset(newSeconds)
  const restart = (newSeconds?: number) => timer.value?.restart(newSeconds)

  onUnmounted(() => {
    timer.value?.destroy()
  })

  return {
    time,
    state,
    start,
    pause,
    resume,
    reset,
    restart
  }
}
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

- **React**: See [React Integration Guide](react-integration.md) for hooks and component examples
- **Vue**: See [Vue Integration Guide](vue-integration.md) for composables and component examples  
- **Angular**: See [Angular Integration Guide](angular-integration.md) for service and component examples
- **Svelte**: See [Svelte Integration Guide](svelte-integration.md) for store and component examples

Each integration file in `examples/integrations/` provides the core integration logic that can be copied directly into your project.

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