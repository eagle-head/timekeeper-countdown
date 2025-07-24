# Vue Integration Guide

Learn how to integrate `timekeeper-countdown` with Vue 3 applications using the Composition API.

## Quick Start

### Basic Vue Composable Implementation

Create your own `useTimekeeper` composable that wraps the TimekeeperCountdown class:

```typescript
// composables/useTimekeeper.ts
import { ref, onUnmounted, watch, type Ref } from 'vue'
import { TimekeeperCountdown } from 'timekeeper-countdown'
import type { 
  CountdownTime, 
  CountdownStateType, 
  TimekeeperCountdownOptions 
} from 'timekeeper-countdown'

export interface UseTimekeeperReturn extends CountdownTime {
  state: Ref<CountdownStateType>
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
  let countdown: TimekeeperCountdown | null = null

  // Reactive state
  const totalSeconds = ref(0)
  const days = ref(0)
  const hours = ref(0)
  const minutes = ref(0)
  const seconds = ref(0)
  const state = ref<CountdownStateType>('IDLE')

  // Update reactive state
  const updateState = (data: CountdownTime & { state: CountdownStateType }) => {
    totalSeconds.value = data.totalSeconds
    days.value = data.days
    hours.value = data.hours
    minutes.value = data.minutes
    seconds.value = data.seconds
    state.value = data.state
  }

  // Initialize countdown
  const initCountdown = () => {
    // Clean up existing countdown
    if (countdown) {
      countdown.destroy()
    }

    countdown = new TimekeeperCountdown(initialSeconds, {
      ...options,
      onTick: (data) => {
        updateState(data)
        options.onTick?.(data)
      },
      onStart: (data) => {
        state.value = data.state
        options.onStart?.(data)
      },
      onPause: (data) => {
        state.value = data.state
        options.onPause?.(data)
      },
      onResume: (data) => {
        state.value = data.state
        options.onResume?.(data)
      },
      onReset: (data) => {
        updateState(data)
        options.onReset?.(data)
      },
      onRestart: (data) => {
        updateState(data)
        options.onRestart?.(data)
      },
      onComplete: (data) => {
        state.value = data.state
        options.onComplete?.(data)
      },
    })

    // Initialize reactive values
    updateState({
      totalSeconds: countdown.totalSeconds,
      days: countdown.days,
      hours: countdown.hours,
      minutes: countdown.minutes,
      seconds: countdown.seconds,
      state: countdown.state,
    })
  }

  // Initialize on mount
  initCountdown()

  // Watch for initialSeconds changes and reinitialize
  watch(() => initialSeconds, () => {
    initCountdown()
  })

  // Control methods
  const start = (): boolean => {
    return countdown?.start() ?? false
  }

  const pause = (): boolean => {
    return countdown?.pause() ?? false
  }

  const resume = (): boolean => {
    return countdown?.resume() ?? false
  }

  const reset = (newSeconds?: number): boolean => {
    return countdown?.reset(newSeconds) ?? false
  }

  const restart = (newSeconds?: number): boolean => {
    return countdown?.restart(newSeconds) ?? false
  }

  // Cleanup on unmount
  onUnmounted(() => {
    countdown?.destroy()
  })

  return {
    totalSeconds: totalSeconds.value,
    days: days.value,
    hours: hours.value,
    minutes: minutes.value,
    seconds: seconds.value,
    state,
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

```vue
<template>
  <div class="countdown-timer">
    <h1>⏳ Countdown Timer</h1>
    
    <div class="time-display">
      {{ formatTime(totalSeconds) }}
    </div>
    
    <div class="state-display">
      Status: {{ state }}
    </div>
    
    <div class="controls">
      <button 
        @click="start" 
        :disabled="state === 'RUNNING'"
        class="btn btn-primary"
      >
        Start
      </button>
      
      <button 
        @click="pause" 
        :disabled="state !== 'RUNNING'"
        class="btn btn-warning"
      >
        Pause
      </button>
      
      <button 
        @click="resume" 
        :disabled="state !== 'PAUSED'"
        class="btn btn-success"
      >
        Resume
      </button>
      
      <button 
        @click="() => reset()" 
        :disabled="state === 'RUNNING'"
        class="btn btn-secondary"
      >
        Reset
      </button>
      
      <button 
        @click="() => restart()" 
        :disabled="state === 'IDLE'"
        class="btn btn-info"
      >
        Restart
      </button>
    </div>
    
    <div class="time-breakdown">
      <span class="time-unit">{{ days }}d</span>
      <span class="time-unit">{{ hours }}h</span>
      <span class="time-unit">{{ minutes }}m</span>
      <span class="time-unit">{{ seconds }}s</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTimekeeper } from '@/composables/useTimekeeper'

const props = defineProps<{
  initialSeconds?: number
}>()

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
} = useTimekeeper(props.initialSeconds ?? 300, {
  onComplete: () => {
    alert('Time\'s up! 🎉')
  },
  onTick: (data) => {
    if (data.totalSeconds <= 10 && data.totalSeconds > 0) {
      console.warn(`⚠️ Only ${data.totalSeconds} seconds left!`)
    }
  }
})

const formatTime = (totalSecs: number) => {
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.countdown-timer {
  text-align: center;
  padding: 2rem;
  font-family: Arial, sans-serif;
}

.time-display {
  font-size: 3rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.state-display {
  font-size: 1.2rem;
  margin: 1rem 0;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  display: inline-block;
}

.controls {
  margin: 1.5rem 0;
}

.btn {
  margin: 0.25rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary { background: #007bff; color: white; }
.btn-warning { background: #ffc107; color: black; }
.btn-success { background: #28a745; color: white; }
.btn-secondary { background: #6c757d; color: white; }
.btn-info { background: #17a2b8; color: white; }

.time-breakdown {
  margin-top: 1rem;
}

.time-unit {
  margin: 0 0.5rem;
  font-size: 1.1rem;
  font-weight: bold;
}
</style>
```

### Advanced Component with Slots

```vue
<template>
  <div class="advanced-countdown" :class="sizeClass">
    <slot name="header" :countdown="countdownData">
      <h2>{{ title }}</h2>
    </slot>
    
    <div class="time-display" :class="stateClass">
      <slot name="time-display" :countdown="countdownData" :formatted-time="formattedTime">
        <div class="time-segments">
          <div v-if="days > 0" class="time-segment">
            <span class="number">{{ days }}</span>
            <span class="label">days</span>
          </div>
          <div class="time-segment">
            <span class="number">{{ hours.toString().padStart(2, '0') }}</span>
            <span class="label">hours</span>
          </div>
          <div class="time-segment">
            <span class="number">{{ minutes.toString().padStart(2, '0') }}</span>
            <span class="label">minutes</span>
          </div>
          <div class="time-segment">
            <span class="number">{{ seconds.toString().padStart(2, '0') }}</span>
            <span class="label">seconds</span>
          </div>
        </div>
      </slot>
    </div>
    
    <div class="controls">
      <slot name="controls" :countdown="countdownData" :actions="actions">
        <button 
          v-if="state === 'IDLE'" 
          @click="start"
          class="control-btn start-btn"
        >
          <slot name="start-text">Start</slot>
        </button>
        
        <button 
          v-if="state === 'RUNNING'" 
          @click="pause"
          class="control-btn pause-btn"
        >
          <slot name="pause-text">Pause</slot>
        </button>
        
        <button 
          v-if="state === 'PAUSED'" 
          @click="resume"
          class="control-btn resume-btn"
        >
          <slot name="resume-text">Resume</slot>
        </button>
        
        <button 
          v-if="state !== 'RUNNING'" 
          @click="() => reset()"
          class="control-btn reset-btn"
        >
          <slot name="reset-text">Reset</slot>
        </button>
      </slot>
    </div>
    
    <slot name="footer" :countdown="countdownData">
      <div class="state-info">
        Current state: <strong>{{ state }}</strong>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTimekeeper } from '@/composables/useTimekeeper'

interface Props {
  initialSeconds: number
  title?: string
  size?: 'small' | 'medium' | 'large'
  onComplete?: () => void
  onTick?: (data: any) => void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Countdown Timer',
  size: 'medium'
})

const emit = defineEmits<{
  complete: []
  tick: [data: any]
  stateChange: [state: string]
}>()

const countdown = useTimekeeper(props.initialSeconds, {
  onComplete: () => {
    props.onComplete?.()
    emit('complete')
  },
  onTick: (data) => {
    props.onTick?.(data)
    emit('tick', data)
  },
  onStart: (data) => emit('stateChange', data.state),
  onPause: (data) => emit('stateChange', data.state),
  onResume: (data) => emit('stateChange', data.state),
  onReset: (data) => emit('stateChange', data.state),
})

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
} = countdown

// Computed properties
const sizeClass = computed(() => `countdown-${props.size}`)

const stateClass = computed(() => `state-${state.value.toLowerCase()}`)

const formattedTime = computed(() => {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

const countdownData = computed(() => ({
  totalSeconds,
  days,
  hours,
  minutes,
  seconds,
  state: state.value,
  formattedTime: formattedTime.value
}))

const actions = computed(() => ({
  start,
  pause,
  resume,
  reset,
  restart
}))
</script>

<style scoped>
.advanced-countdown {
  border-radius: 12px;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}

.countdown-small { font-size: 0.8rem; }
.countdown-medium { font-size: 1rem; }
.countdown-large { font-size: 1.2rem; }

.time-display {
  margin: 1.5rem 0;
  padding: 1rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.time-segments {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.time-segment {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.number {
  font-size: 2em;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.label {
  font-size: 0.8em;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.control-btn {
  margin: 0.25rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.start-btn { background: #28a745; color: white; }
.pause-btn { background: #ffc107; color: black; }
.resume-btn { background: #17a2b8; color: white; }
.reset-btn { background: #6c757d; color: white; }

.control-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.state-info {
  margin-top: 1rem;
  font-size: 0.9rem;
  opacity: 0.9;
}

/* State-based styling */
.state-idle { border-left: 4px solid #6c757d; }
.state-running { border-left: 4px solid #28a745; }
.state-paused { border-left: 4px solid #ffc107; }
.state-completed { border-left: 4px solid #dc3545; }
</style>
```

## Integration Patterns

### Provide/Inject Pattern

```typescript
// plugins/countdown.ts
import { App, inject, provide, InjectionKey } from 'vue'
import { useTimekeeper, UseTimekeeperReturn } from '@/composables/useTimekeeper'

const CountdownKey: InjectionKey<UseTimekeeperReturn> = Symbol('countdown')

export function provideCountdown(initialSeconds: number, options = {}) {
  const countdown = useTimekeeper(initialSeconds, options)
  provide(CountdownKey, countdown)
  return countdown
}

export function useCountdownInject() {
  const countdown = inject(CountdownKey)
  if (!countdown) {
    throw new Error('useCountdownInject must be used within a countdown provider')
  }
  return countdown
}

// Plugin installation
export default {
  install(app: App) {
    app.config.globalProperties.$countdown = useTimekeeper
  }
}
```

### Store Integration (Pinia)

```typescript
// stores/countdown.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { TimekeeperCountdown } from 'timekeeper-countdown'
import type { CountdownStateType } from 'timekeeper-countdown'

export const useCountdownStore = defineStore('countdown', () => {
  // State
  const countdown = ref<TimekeeperCountdown | null>(null)
  const totalSeconds = ref(0)
  const state = ref<CountdownStateType>('IDLE')
  const isInitialized = ref(false)

  // Getters
  const formattedTime = computed(() => {
    const mins = Math.floor(totalSeconds.value / 60)
    const secs = totalSeconds.value % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  })

  const isRunning = computed(() => state.value === 'RUNNING')
  const isPaused = computed(() => state.value === 'PAUSED')
  const isCompleted = computed(() => state.value === 'COMPLETED')

  // Actions
  function initialize(initialSeconds: number, options = {}) {
    if (countdown.value) {
      countdown.value.destroy()
    }

    countdown.value = new TimekeeperCountdown(initialSeconds, {
      ...options,
      onTick: (data) => {
        totalSeconds.value = data.totalSeconds
        state.value = data.state
      },
      onStart: (data) => state.value = data.state,
      onPause: (data) => state.value = data.state,
      onResume: (data) => state.value = data.state,
      onReset: (data) => {
        totalSeconds.value = data.totalSeconds
        state.value = data.state
      },
      onComplete: (data) => state.value = data.state,
    })

    totalSeconds.value = countdown.value.totalSeconds
    state.value = countdown.value.state
    isInitialized.value = true
  }

  function start() {
    return countdown.value?.start() ?? false
  }

  function pause() {
    return countdown.value?.pause() ?? false
  }

  function resume() {
    return countdown.value?.resume() ?? false
  }

  function reset(newSeconds?: number) {
    return countdown.value?.reset(newSeconds) ?? false
  }

  function restart(newSeconds?: number) {
    return countdown.value?.restart(newSeconds) ?? false
  }

  function destroy() {
    countdown.value?.destroy()
    countdown.value = null
    isInitialized.value = false
    totalSeconds.value = 0
    state.value = 'IDLE'
  }

  return {
    // State
    totalSeconds,
    state,
    isInitialized,
    
    // Getters
    formattedTime,
    isRunning,
    isPaused,
    isCompleted,
    
    // Actions
    initialize,
    start,
    pause,
    resume,
    reset,
    restart,
    destroy
  }
})
```

## Custom Composable Variations

### Timer with Persistence

```typescript
// composables/usePersistedTimekeeper.ts
import { watch } from 'vue'
import { useTimekeeper } from './useTimekeeper'
import { useLocalStorage } from '@vueuse/core'

export function usePersistedTimekeeper(
  key: string,
  defaultSeconds: number,
  options = {}
) {
  const savedState = useLocalStorage(`countdown-${key}`, {
    totalSeconds: defaultSeconds,
    state: 'IDLE'
  })

  const countdown = useTimekeeper(savedState.value.totalSeconds, {
    ...options,
    onTick: (data) => {
      savedState.value = {
        totalSeconds: data.totalSeconds,
        state: data.state
      }
      options.onTick?.(data)
    },
    onReset: (data) => {
      savedState.value = {
        totalSeconds: data.totalSeconds,
        state: data.state
      }
      options.onReset?.(data)
    }
  })

  return countdown
}
```

### Multiple Timers Manager

```typescript
// composables/useMultipleTimers.ts
import { ref, reactive } from 'vue'
import { useTimekeeper } from './useTimekeeper'

interface TimerConfig {
  id: string
  initialSeconds: number
  label?: string
  onComplete?: () => void
}

export function useMultipleTimers(configs: TimerConfig[]) {
  const timers = reactive<Record<string, ReturnType<typeof useTimekeeper>>>({})
  const activeTimers = ref<string[]>([])

  // Initialize timers
  configs.forEach(config => {
    timers[config.id] = useTimekeeper(config.initialSeconds, {
      onComplete: config.onComplete,
      onStart: () => {
        if (!activeTimers.value.includes(config.id)) {
          activeTimers.value.push(config.id)
        }
      },
      onPause: () => {
        const index = activeTimers.value.indexOf(config.id)
        if (index > -1) {
          activeTimers.value.splice(index, 1)
        }
      }
    })
  })

  const startAll = () => {
    Object.values(timers).forEach(timer => timer.start())
  }

  const pauseAll = () => {
    Object.values(timers).forEach(timer => timer.pause())
  }

  const resetAll = () => {
    Object.values(timers).forEach(timer => timer.reset())
    activeTimers.value = []
  }

  return {
    timers,
    activeTimers,
    startAll,
    pauseAll,
    resetAll
  }
}
```

## Best Practices

1. **Reactivity**: Use Vue's ref/reactive for state that needs to trigger re-renders
2. **Cleanup**: Always use `onUnmounted` to clean up TimekeeperCountdown instances
3. **Watchers**: Use watchers sparingly - prefer TimekeeperCountdown options callbacks for performance
4. **Composable Design**: Keep composables focused and reusable around the TimekeeperCountdown class
5. **Type Safety**: Always provide proper TypeScript types for better DX

## Testing

```typescript
// tests/useTimekeeper.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { useTimekeeper } from '@/composables/useTimekeeper'

describe('useTimekeeper', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('should initialize with correct values', () => {
    const { totalSeconds, state } = useTimekeeper(60)
    
    expect(totalSeconds).toBe(60)
    expect(state.value).toBe('IDLE')
  })

  it('should start and tick correctly', async () => {
    const { totalSeconds, state, start } = useTimekeeper(5)
    
    start()
    expect(state.value).toBe('RUNNING')
    
    vi.advanceTimersByTime(1000)
    expect(totalSeconds).toBe(4)
    
    vi.advanceTimersByTime(4000)
    expect(totalSeconds).toBe(0)
    expect(state.value).toBe('COMPLETED')
  })
})
```