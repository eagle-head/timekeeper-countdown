# Svelte Integration Guide

Learn how to integrate `timekeeper-countdown` with Svelte applications.

## Quick Start

### Basic Store Implementation

Create a custom Svelte store for managing countdown state:

```typescript
// stores/timekeeper.ts
import { writable, readable, derived, type Readable } from 'svelte/store'
import { TimekeeperCountdown } from 'timekeeper-countdown'
import type { 
  CountdownTime, 
  CountdownStateType, 
  TimekeeperCountdownOptions 
} from 'timekeeper-countdown'

export interface TimekeeperStore extends CountdownTime {
  state: CountdownStateType
}

export interface TimekeeperActions {
  start: () => boolean
  pause: () => boolean
  resume: () => boolean
  reset: (newSeconds?: number) => boolean
  restart: (newSeconds?: number) => boolean
  destroy: () => void
}

export function createTimekeeper(
  initialSeconds: number,
  options: TimekeeperCountdownOptions = {}
): { 
  subscribe: Readable<TimekeeperStore>['subscribe']
  actions: TimekeeperActions
} {
  let countdown: TimekeeperCountdown | null = null
  
  const store = writable<TimekeeperStore>({
    totalSeconds: initialSeconds,
    days: Math.floor(initialSeconds / 86400),
    hours: Math.floor((initialSeconds % 86400) / 3600),
    minutes: Math.floor((initialSeconds % 3600) / 60),
    seconds: initialSeconds % 60,
    state: 'IDLE'
  })

  const initializeCountdown = () => {
    if (countdown) {
      countdown.destroy()
    }

    countdown = new TimekeeperCountdown(initialSeconds, {
      ...options,
      onTick: (data) => {
        store.set({
          totalSeconds: data.totalSeconds,
          days: data.days,
          hours: data.hours,
          minutes: data.minutes,
          seconds: data.seconds,
          state: data.state
        })
        options.onTick?.(data)
      },
      onStart: (data) => {
        store.update(current => ({ ...current, state: data.state }))
        options.onStart?.(data)
      },
      onPause: (data) => {
        store.update(current => ({ ...current, state: data.state }))
        options.onPause?.(data)
      },
      onResume: (data) => {
        store.update(current => ({ ...current, state: data.state }))
        options.onResume?.(data)
      },
      onReset: (data) => {
        store.set({
          totalSeconds: data.totalSeconds,
          days: data.days,
          hours: data.hours,
          minutes: data.minutes,
          seconds: data.seconds,
          state: data.state
        })
        options.onReset?.(data)
      },
      onRestart: (data) => {
        store.set({
          totalSeconds: data.totalSeconds,
          days: data.days,
          hours: data.hours,
          minutes: data.minutes,
          seconds: data.seconds,
          state: data.state
        })
        options.onRestart?.(data)
      },
      onComplete: (data) => {
        store.update(current => ({ ...current, state: data.state }))
        options.onComplete?.(data)
      }
    })
  }

  initializeCountdown()

  const actions: TimekeeperActions = {
    start: () => countdown?.start() ?? false,
    pause: () => countdown?.pause() ?? false,
    resume: () => countdown?.resume() ?? false,
    reset: (newSeconds?: number) => countdown?.reset(newSeconds) ?? false,
    restart: (newSeconds?: number) => countdown?.restart(newSeconds) ?? false,
    destroy: () => {
      countdown?.destroy()
      countdown = null
    }
  }

  return {
    subscribe: store.subscribe,
    actions
  }
}
```

## Usage Examples

### Basic Component

```svelte
<!-- CountdownTimer.svelte -->
<script lang="ts">
  import { onDestroy } from 'svelte'
  import { createTimekeeper } from '../stores/timekeeper'

  export let initialSeconds = 300

  const { subscribe, actions } = createTimekeeper(initialSeconds, {
    onComplete: () => {
      alert('Time\'s up! 🎉')
    }
  })

  $: timekeeper = subscribe
  
  function formatTime(totalSecs: number): string {
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  onDestroy(() => {
    actions.destroy()
  })
</script>

<div class="countdown-container">
  <h1>⏳ Countdown Timer</h1>
  
  <div class="time-display">
    {formatTime($timekeeper.totalSeconds)}
  </div>
  
  <div class="state">
    Status: {$timekeeper.state}
  </div>
  
  <div class="controls">
    <button 
      on:click={actions.start} 
      disabled={$timekeeper.state === 'RUNNING'}
    >
      Start
    </button>
    
    <button 
      on:click={actions.pause} 
      disabled={$timekeeper.state !== 'RUNNING'}
    >
      Pause
    </button>
    
    <button 
      on:click={actions.resume} 
      disabled={$timekeeper.state !== 'PAUSED'}
    >
      Resume
    </button>
    
    <button 
      on:click={() => actions.reset()} 
      disabled={$timekeeper.state === 'RUNNING'}
    >
      Reset
    </button>
    
    <button 
      on:click={() => actions.restart()} 
      disabled={$timekeeper.state === 'IDLE'}
    >
      Restart
    </button>
  </div>
  
  <div class="breakdown">
    <span>{$timekeeper.days}d</span>
    <span>{$timekeeper.hours}h</span>
    <span>{$timekeeper.minutes}m</span>
    <span>{$timekeeper.seconds}s</span>
  </div>
</div>

<style>
  .countdown-container {
    text-align: center;
    padding: 2rem;
    max-width: 400px;
    margin: 0 auto;
  }

  .time-display {
    font-size: 3rem;
    font-family: monospace;
    font-weight: bold;
    margin: 1rem 0;
    color: #333;
  }

  .state {
    margin: 1rem 0;
    font-weight: bold;
    text-transform: uppercase;
  }

  .controls {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
    margin: 2rem 0;
  }

  .controls button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    background: #007bff;
    color: white;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .controls button:hover:not(:disabled) {
    background: #0056b3;
  }

  .controls button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .breakdown {
    display: flex;
    gap: 1rem;
    justify-content: center;
    font-family: monospace;
    font-size: 1.2rem;
  }

  .breakdown span {
    background: #f8f9fa;
    padding: 0.5rem;
    border-radius: 4px;
    min-width: 3rem;
  }
</style>
```

### Advanced Component with Props

```svelte
<!-- AdvancedCountdown.svelte -->
<script lang="ts">
  import { onDestroy } from 'svelte'
  import { createTimekeeper } from '../stores/timekeeper'

  export let initialSeconds: number
  export let onComplete: (() => void) | undefined = undefined
  export let size: 'small' | 'medium' | 'large' = 'medium'
  export let showDays = true
  export let autoStart = false

  const { subscribe, actions } = createTimekeeper(initialSeconds, {
    autoStart,
    onComplete,
    onTick: (data) => {
      // Warning when less than 10 seconds
      if (data.totalSeconds <= 10 && data.totalSeconds > 0) {
        console.warn(`⚠️ Only ${data.totalSeconds} seconds left!`)
      }
    }
  })

  $: timekeeper = subscribe

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

  onDestroy(() => {
    actions.destroy()
  })
</script>

<div class="countdown-container">
  <div class="time-display {sizeClasses[size]}">
    {#if showDays && $timekeeper.days > 0}
      <span>{$timekeeper.days}d </span>
    {/if}
    <span>{$timekeeper.hours.toString().padStart(2, '0')}:</span>
    <span>{$timekeeper.minutes.toString().padStart(2, '0')}:</span>
    <span>{$timekeeper.seconds.toString().padStart(2, '0')}</span>
  </div>
  
  <div class="state-indicator {stateColors[$timekeeper.state]}">
    {$timekeeper.state}
  </div>
  
  <div class="controls">
    {#if $timekeeper.state === 'IDLE'}
      <button 
        on:click={actions.start}
        class="btn-primary"
      >
        Start
      </button>
    {/if}
    
    {#if $timekeeper.state === 'RUNNING'}
      <button 
        on:click={actions.pause}
        class="btn-warning"
      >
        Pause
      </button>
    {/if}
    
    {#if $timekeeper.state === 'PAUSED'}
      <button 
        on:click={actions.resume}
        class="btn-success"
      >
        Resume
      </button>
    {/if}
    
    {#if $timekeeper.state !== 'RUNNING'}
      <button 
        on:click={() => actions.reset()}
        class="btn-secondary"
      >
        Reset
      </button>
    {/if}
  </div>
</div>

<style>
  .countdown-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .time-display {
    font-family: monospace;
    font-weight: bold;
  }

  .text-lg { font-size: 1.125rem; }
  .text-2xl { font-size: 1.5rem; }
  .text-4xl { font-size: 2.25rem; }

  .state-indicator {
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-weight: bold;
  }

  .bg-gray-500 { background-color: #6b7280; }
  .bg-green-500 { background-color: #10b981; }
  .bg-yellow-500 { background-color: #f59e0b; }
  .bg-red-500 { background-color: #ef4444; }

  .controls {
    display: flex;
    gap: 0.5rem;
  }

  .controls button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.25rem;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary { background-color: #3b82f6; }
  .btn-primary:hover { background-color: #2563eb; }
  
  .btn-warning { background-color: #f59e0b; }
  .btn-warning:hover { background-color: #d97706; }
  
  .btn-success { background-color: #10b981; }
  .btn-success:hover { background-color: #059669; }
  
  .btn-secondary { background-color: #6b7280; }
  .btn-secondary:hover { background-color: #4b5563; }
</style>
```

## Store Patterns

### Context Store Pattern

```typescript
// stores/countdown-context.ts
import { getContext, setContext } from 'svelte'
import { createTimekeeper, type TimekeeperStore, type TimekeeperActions } from './timekeeper'

const COUNTDOWN_KEY = Symbol('countdown')

export interface CountdownContext {
  timekeeper: { subscribe: (fn: (value: TimekeeperStore) => void) => () => void }
  actions: TimekeeperActions
  formatTime: (seconds: number) => string
}

export function setCountdownContext(
  initialSeconds: number, 
  options = {}
): CountdownContext {
  const { subscribe, actions } = createTimekeeper(initialSeconds, options)
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const context: CountdownContext = {
    timekeeper: { subscribe },
    actions,
    formatTime
  }

  setContext(COUNTDOWN_KEY, context)
  return context
}

export function getCountdownContext(): CountdownContext {
  const context = getContext<CountdownContext>(COUNTDOWN_KEY)
  if (!context) {
    throw new Error('getCountdownContext must be used within a countdown context')
  }
  return context
}
```

### Multiple Timers Store

```typescript
// stores/multi-timer.ts
import { writable } from 'svelte/store'
import { createTimekeeper, type TimekeeperStore, type TimekeeperActions } from './timekeeper'

export interface Timer {
  id: string
  label: string
  timekeeper: { subscribe: (fn: (value: TimekeeperStore) => void) => () => void }
  actions: TimekeeperActions
}

function createMultiTimerStore() {
  const { subscribe, set, update } = writable<Timer[]>([])

  return {
    subscribe,
    addTimer: (id: string, label: string, initialSeconds: number, options = {}) => {
      const { subscribe: timerSubscribe, actions } = createTimekeeper(initialSeconds, options)
      
      const timer: Timer = {
        id,
        label,
        timekeeper: { subscribe: timerSubscribe },
        actions
      }

      update(timers => [...timers, timer])
      return timer
    },
    removeTimer: (id: string) => {
      update(timers => {
        const timer = timers.find(t => t.id === id)
        if (timer) {
          timer.actions.destroy()
        }
        return timers.filter(t => t.id !== id)
      })
    },
    clear: () => {
      update(timers => {
        timers.forEach(timer => timer.actions.destroy())
        return []
      })
    }
  }
}

export const multiTimer = createMultiTimerStore()
```

## SvelteKit Integration

### Page Component

```svelte
<!-- src/routes/timer/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import CountdownTimer from '$lib/components/CountdownTimer.svelte'

  // Get initial seconds from URL params or default to 5 minutes
  $: initialSeconds = parseInt($page.url.searchParams.get('seconds') || '300')

  function updateUrl(seconds: number) {
    const url = new URL($page.url)
    url.searchParams.set('seconds', seconds.toString())
    goto(url.toString(), { replaceState: true })
  }

  function handleComplete() {
    console.log('Timer completed!')
    // Could navigate to a completion page
    // goto('/timer/complete')
  }
</script>

<svelte:head>
  <title>Countdown Timer</title>
  <meta name="description" content="A customizable countdown timer" />
</svelte:head>

<main>
  <h1>Countdown Timer</h1>
  
  <div class="timer-controls">
    <label>
      Set Timer (seconds):
      <input 
        type="number" 
        min="1" 
        max="86400"
        value={initialSeconds}
        on:change={(e) => updateUrl(parseInt(e.currentTarget.value))}
      />
    </label>
  </div>

  <CountdownTimer 
    {initialSeconds}
    onComplete={handleComplete}
  />
</main>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .timer-controls {
    margin-bottom: 2rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 200px;
  }

  input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
</style>
```

## TypeScript Integration

### Type-Safe Store

```typescript
// lib/types/timer.ts
import type { CountdownStateType, CountdownTime } from 'timekeeper-countdown'

export interface TimerConfig {
  id: string
  label: string
  initialSeconds: number
  autoStart?: boolean
  showNotifications?: boolean
}

export interface TimerState extends CountdownTime {
  state: CountdownStateType
  config: TimerConfig
}

export type TimerEvent = 
  | { type: 'START'; timerId: string }
  | { type: 'PAUSE'; timerId: string }
  | { type: 'RESUME'; timerId: string }
  | { type: 'RESET'; timerId: string; newSeconds?: number }
  | { type: 'COMPLETE'; timerId: string }
```

### Action Types

```typescript
// lib/stores/typed-timekeeper.ts
import type { Writable } from 'svelte/store'
import type { TimerState, TimerEvent } from '../types/timer'

export interface TypedTimekeeperActions {
  start(): boolean
  pause(): boolean
  resume(): boolean
  reset(newSeconds?: number): boolean
  restart(newSeconds?: number): boolean
  destroy(): void
}

export interface TypedTimekeeperStore extends Writable<TimerState> {
  actions: TypedTimekeeperActions
}
```

## Best Practices

1. **Cleanup**: Always call `actions.destroy()` in `onDestroy()` to prevent memory leaks
2. **Reactivity**: Use `$:` reactive statements to compute derived values
3. **Store Management**: Keep timer state in stores for complex applications
4. **Component Props**: Make components reusable with proper prop interfaces
5. **Error Handling**: Wrap timer operations in try-catch blocks for production apps

## Common Patterns

### Timer Grid

```svelte
<!-- TimerGrid.svelte -->
<script lang="ts">
  import { multiTimer } from '../stores/multi-timer'
  import TimerCard from './TimerCard.svelte'

  const presets = [
    { label: 'Pomodoro', seconds: 1500 },
    { label: 'Short Break', seconds: 300 },
    { label: 'Long Break', seconds: 900 }
  ]

  function addPresetTimer(preset: typeof presets[0]) {
    const id = `timer-${Date.now()}`
    multiTimer.addTimer(id, preset.label, preset.seconds)
  }
</script>

<div class="timer-grid">
  <div class="presets">
    <h3>Quick Start</h3>
    {#each presets as preset}
      <button on:click={() => addPresetTimer(preset)}>
        Add {preset.label} ({Math.floor(preset.seconds / 60)}m)
      </button>
    {/each}
  </div>

  <div class="active-timers">
    {#each $multiTimer as timer (timer.id)}
      <TimerCard {timer} />
    {/each}
  </div>
</div>

<style>
  .timer-grid {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .presets {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .presets button {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .presets button:hover {
    background: #f8f9fa;
    border-color: #007bff;
  }

  .active-timers {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  @media (max-width: 768px) {
    .timer-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
```

### Persistent Timer (using localStorage)

```typescript
// stores/persistent-timekeeper.ts
import { browser } from '$app/environment'
import { createTimekeeper } from './timekeeper'

export function createPersistentTimekeeper(
  key: string,
  initialSeconds: number,
  options = {}
) {
  // Load saved state from localStorage
  let savedSeconds = initialSeconds
  if (browser) {
    const saved = localStorage.getItem(`timer-${key}`)
    if (saved) {
      savedSeconds = parseInt(saved)
    }
  }

  const { subscribe, actions } = createTimekeeper(savedSeconds, {
    ...options,
    onTick: (data) => {
      // Save current state to localStorage
      if (browser) {
        localStorage.setItem(`timer-${key}`, data.totalSeconds.toString())
      }
      options.onTick?.(data)
    },
    onReset: (data) => {
      if (browser) {
        localStorage.removeItem(`timer-${key}`)
      }
      options.onReset?.(data)
    }
  })

  return {
    subscribe,
    actions: {
      ...actions,
      clearSaved: () => {
        if (browser) {
          localStorage.removeItem(`timer-${key}`)
        }
      }
    }
  }
}
```