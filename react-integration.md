# React Integration Guide

Learn how to integrate `timekeeper-countdown` with React applications.

## Quick Start

### Basic Hook Implementation

Create your own `useTimekeeper` hook:

```typescript
// hooks/useTimekeeper.ts
import { useEffect, useRef, useState, useCallback } from 'react'
import { TimekeeperCountdown } from 'timekeeper-countdown'
import type { 
  CountdownTime, 
  CountdownStateType, 
  TimekeeperCountdownOptions 
} from 'timekeeper-countdown'

export interface UseTimekeeperReturn extends CountdownTime {
  state: CountdownStateType
  start: () => boolean
  pause: () => boolean
  resume: () => boolean
  reset: (newSeconds?: number) => boolean
  restart: (newSeconds?: number) => boolean
}

export function useTimekeeper(
  initialSeconds: number,
  options: Omit<TimekeeperCountdownOptions, 'onTick' | 'onStart' | 'onPause' | 'onResume' | 'onReset' | 'onRestart' | 'onComplete'> & {
    onTick?: (data: CountdownTime & { state: CountdownStateType }) => void
    onStart?: (data: CountdownTime & { state: CountdownStateType }) => void
    onPause?: (data: CountdownTime & { state: CountdownStateType }) => void
    onResume?: (data: CountdownTime & { state: CountdownStateType }) => void
    onReset?: (data: CountdownTime & { state: CountdownStateType }) => void
    onRestart?: (data: CountdownTime & { state: CountdownStateType }) => void
    onComplete?: (data: CountdownTime & { state: CountdownStateType }) => void
  } = {}
): UseTimekeeperReturn {
  const countdownRef = useRef<TimekeeperCountdown | null>(null)
  const [state, setState] = useState<CountdownTime & { state: CountdownStateType }>(() => {
    // Initialize with the initial time values
    const countdown = new TimekeeperCountdown(initialSeconds)
    const initialState = {
      totalSeconds: countdown.totalSeconds,
      days: countdown.days,
      hours: countdown.hours,
      minutes: countdown.minutes,
      seconds: countdown.seconds,
      state: countdown.state,
    }
    countdown.destroy() // Clean up temporary instance
    return initialState
  })

  // Stable callbacks
  const onTick = useCallback((data: Parameters<NonNullable<typeof options.onTick>>[0]) => {
    setState({
      totalSeconds: data.totalSeconds,
      days: data.days,
      hours: data.hours,
      minutes: data.minutes,
      seconds: data.seconds,
      state: data.state,
    })
    options.onTick?.(data)
  }, [options.onTick])

  const onStart = useCallback((data: Parameters<NonNullable<typeof options.onStart>>[0]) => {
    setState(prev => ({ ...prev, state: data.state }))
    options.onStart?.(data)
  }, [options.onStart])

  const onPause = useCallback((data: Parameters<NonNullable<typeof options.onPause>>[0]) => {
    setState(prev => ({ ...prev, state: data.state }))
    options.onPause?.(data)
  }, [options.onPause])

  const onResume = useCallback((data: Parameters<NonNullable<typeof options.onResume>>[0]) => {
    setState(prev => ({ ...prev, state: data.state }))
    options.onResume?.(data)
  }, [options.onResume])

  const onReset = useCallback((data: Parameters<NonNullable<typeof options.onReset>>[0]) => {
    setState({
      totalSeconds: data.totalSeconds,
      days: data.days,
      hours: data.hours,
      minutes: data.minutes,
      seconds: data.seconds,
      state: data.state,
    })
    options.onReset?.(data)
  }, [options.onReset])

  const onRestart = useCallback((data: Parameters<NonNullable<typeof options.onRestart>>[0]) => {
    setState({
      totalSeconds: data.totalSeconds,
      days: data.days,
      hours: data.hours,
      minutes: data.minutes,
      seconds: data.seconds,
      state: data.state,
    })
    options.onRestart?.(data)
  }, [options.onRestart])

  const onComplete = useCallback((data: Parameters<NonNullable<typeof options.onComplete>>[0]) => {
    setState(prev => ({ ...prev, state: data.state }))
    options.onComplete?.(data)
  }, [options.onComplete])

  // Initialize countdown
  useEffect(() => {
    countdownRef.current = new TimekeeperCountdown(initialSeconds, {
      ...options,
      onTick,
      onStart,
      onPause,
      onResume,
      onReset,
      onRestart,
      onComplete,
    })

    return () => {
      countdownRef.current?.destroy()
    }
  }, [initialSeconds, options.autoStart, onTick, onStart, onPause, onResume, onReset, onRestart, onComplete])

  // Control methods
  const start = useCallback(() => {
    return countdownRef.current?.start() ?? false
  }, [])

  const pause = useCallback(() => {
    return countdownRef.current?.pause() ?? false
  }, [])

  const resume = useCallback(() => {
    return countdownRef.current?.resume() ?? false
  }, [])

  const reset = useCallback((newSeconds?: number) => {
    return countdownRef.current?.reset(newSeconds) ?? false
  }, [])

  const restart = useCallback((newSeconds?: number) => {
    return countdownRef.current?.restart(newSeconds) ?? false
  }, [])

  return {
    totalSeconds: state.totalSeconds,
    days: state.days,
    hours: state.hours,
    minutes: state.minutes,
    seconds: state.seconds,
    state: state.state,
    start,
    pause,
    resume,
    reset,
    restart,
  }
}
```

## Usage Examples

### Basic Component

```tsx
import React from 'react'
import { useTimekeeper } from './hooks/useTimekeeper'

function CountdownTimer() {
  const {
    totalSeconds,
    days,
    hours,
    minutes,
    seconds,
    state,
    start,
    pause,
    resume,
    reset,
    restart
  } = useTimekeeper(300, {
    onComplete: () => {
      alert('Time\'s up! 🎉')
    }
  })

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div>
      <h1>⏳ Countdown Timer</h1>
      <div className="time-display">
        {formatTime(totalSeconds)}
      </div>
      <div className="state">
        Status: {state}
      </div>
      <div className="controls">
        <button onClick={start} disabled={state === 'RUNNING'}>
          Start
        </button>
        <button onClick={pause} disabled={state !== 'RUNNING'}>
          Pause
        </button>
        <button onClick={resume} disabled={state !== 'PAUSED'}>
          Resume
        </button>
        <button onClick={() => reset()} disabled={state === 'RUNNING'}>
          Reset
        </button>
        <button onClick={() => restart()} disabled={state === 'IDLE'}>
          Restart
        </button>
      </div>
      <div className="breakdown">
        <span>{days}d</span>
        <span>{hours}h</span>
        <span>{minutes}m</span>
        <span>{seconds}s</span>
      </div>
    </div>
  )
}

export default CountdownTimer
```

### Advanced Component with Custom Styling

```tsx
import React from 'react'
import { useTimekeeper } from './hooks/useTimekeeper'

interface CountdownProps {
  initialSeconds: number
  onComplete?: () => void
  className?: string
  size?: 'small' | 'medium' | 'large'
}

function AdvancedCountdown({ 
  initialSeconds, 
  onComplete, 
  className = '',
  size = 'medium' 
}: CountdownProps) {
  const {
    totalSeconds,
    days,
    hours,
    minutes,
    seconds,
    state,
    start,
    pause,
    resume,
    reset
  } = useTimekeeper(initialSeconds, {
    onComplete,
    onTick: (data) => {
      // Warning when less than 10 seconds
      if (data.totalSeconds <= 10 && data.totalSeconds > 0) {
        console.warn(`⚠️ Only ${data.totalSeconds} seconds left!`)
      }
    }
  })

  const sizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl'
  }

  const stateColors = {
    IDLE: 'bg-gray-500',
    RUNNING: 'bg-green-500',
    PAUSED: 'bg-yellow-500',
    COMPLETED: 'bg-red-500'
  }

  return (
    <div className={`countdown-container ${className}`}>
      <div className={`time-display ${sizeClasses[size]} font-mono font-bold`}>
        {days > 0 && <span>{days}d </span>}
        <span>{hours.toString().padStart(2, '0')}:</span>
        <span>{minutes.toString().padStart(2, '0')}:</span>
        <span>{seconds.toString().padStart(2, '0')}</span>
      </div>
      
      <div className={`state-indicator ${stateColors[state]} text-white px-2 py-1 rounded`}>
        {state}
      </div>
      
      <div className="controls space-x-2">
        {state === 'IDLE' && (
          <button 
            onClick={start}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Start
          </button>
        )}
        
        {state === 'RUNNING' && (
          <button 
            onClick={pause}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Pause
          </button>
        )}
        
        {state === 'PAUSED' && (
          <button 
            onClick={resume}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Resume
          </button>
        )}
        
        {state !== 'RUNNING' && (
          <button 
            onClick={() => reset()}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

export default AdvancedCountdown
```

## Integration Patterns

### Context Provider Pattern

```tsx
// CountdownContext.tsx
import React, { createContext, useContext, ReactNode } from 'react'
import { useTimekeeper, UseTimekeeperReturn } from './hooks/useTimekeeper'

interface CountdownContextValue extends UseTimekeeperReturn {
  formatTime: (seconds: number) => string
}

const CountdownContext = createContext<CountdownContextValue | null>(null)

interface CountdownProviderProps {
  children: ReactNode
  initialSeconds: number
  onComplete?: () => void
}

export function CountdownProvider({ 
  children, 
  initialSeconds, 
  onComplete 
}: CountdownProviderProps) {
  const countdown = useTimekeeper(initialSeconds, { onComplete })
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const value: CountdownContextValue = {
    ...countdown,
    formatTime
  }

  return (
    <CountdownContext.Provider value={value}>
      {children}
    </CountdownContext.Provider>
  )
}

export function useCountdownContext() {
  const context = useContext(CountdownContext)
  if (!context) {
    throw new Error('useCountdownContext must be used within CountdownProvider')
  }
  return context
}
```

### Custom Hook Variations

```tsx
// hooks/useCountdownTimer.ts - Simplified version
import { useTimekeeper } from './useTimekeeper'

export function useCountdownTimer(minutes: number) {
  const countdown = useTimekeeper(minutes * 60, {
    onComplete: () => {
      // Play sound or show notification
      new Audio('/notification.mp3').play()
    }
  })

  const formattedTime = `${Math.floor(countdown.totalSeconds / 60)
    .toString().padStart(2, '0')}:${(countdown.totalSeconds % 60)
    .toString().padStart(2, '0')}`

  return {
    ...countdown,
    formattedTime,
    isRunning: countdown.state === 'RUNNING',
    isPaused: countdown.state === 'PAUSED',
    isCompleted: countdown.state === 'COMPLETED'
  }
}
```

## TypeScript Tips

### Extending the Hook

```typescript
interface ExtendedTimekeeperOptions {
  showNotifications?: boolean
  playSound?: boolean
  customWarningThreshold?: number
}

export function useAdvancedTimekeeper(
  initialSeconds: number,
  options: ExtendedTimekeeperOptions = {}
) {
  const {
    showNotifications = true,
    playSound = true,
    customWarningThreshold = 10
  } = options

  return useTimekeeper(initialSeconds, {
    onTick: (data) => {
      if (data.totalSeconds <= customWarningThreshold && data.totalSeconds > 0) {
        if (showNotifications && 'Notification' in window) {
          new Notification(`${data.totalSeconds} seconds remaining!`)
        }
      }
    },
    onComplete: () => {
      if (playSound) {
        new Audio('/complete.mp3').play()
      }
      if (showNotifications && 'Notification' in window) {
        new Notification('Timer completed!')
      }
    }
  })
}
```

## Best Practices

1. **Cleanup**: Always let the hook handle cleanup - don't manually call `destroy()`
2. **Memoization**: Use `useCallback` for event handlers to prevent unnecessary re-renders
3. **State Management**: Keep countdown state local unless you need global access
4. **Performance**: Avoid creating new objects in render - use refs for stable values
5. **Testing**: Mock the `TimekeeperCountdown` class for easier unit testing

## Common Patterns

### Multiple Timers

```tsx
function MultipleTimers() {
  const timer1 = useTimekeeper(300) // 5 minutes
  const timer2 = useTimekeeper(600) // 10 minutes
  const timer3 = useTimekeeper(900) // 15 minutes

  return (
    <div>
      <TimerDisplay label="Timer 1" countdown={timer1} />
      <TimerDisplay label="Timer 2" countdown={timer2} />
      <TimerDisplay label="Timer 3" countdown={timer3} />
    </div>
  )
}
```

### Synchronized Timers

```tsx
function SynchronizedTimers() {
  const [isGlobalRunning, setIsGlobalRunning] = useState(false)
  
  const timer1 = useTimekeeper(300)
  const timer2 = useTimekeeper(600)

  const startAll = () => {
    timer1.start()
    timer2.start()
    setIsGlobalRunning(true)
  }

  const pauseAll = () => {
    timer1.pause()
    timer2.pause()
    setIsGlobalRunning(false)
  }

  return (
    <div>
      <button onClick={startAll} disabled={isGlobalRunning}>
        Start All
      </button>
      <button onClick={pauseAll} disabled={!isGlobalRunning}>
        Pause All
      </button>
      {/* Timer displays */}
    </div>
  )
}
```