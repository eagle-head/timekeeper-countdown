# Timekeeper Countdown ⏳

Ultra-lightweight, framework-agnostic countdown timer library. Pure TypeScript with zero dependencies.

## Why Timekeeper Countdown?

- 🪶 **Ultra-lightweight** - Only ~3KB minified + gzipped
- 🚀 **Zero Dependencies** - No external runtime dependencies
- 🎯 **TypeScript First** - Built with TypeScript, works with plain JavaScript
- 🔄 **State Machine** - Predictable state transitions (IDLE → RUNNING → PAUSED → COMPLETED)
- ⚡ **Framework Agnostic** - Works with any framework or vanilla JS
- 📚 **Rich Documentation** - Complete integration guides for React, Vue, Angular
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
import { TimekeeperCountdown } from 'timekeeper-countdown'

// Create a 5-minute countdown
const countdown = new TimekeeperCountdown(300, {
  onTick: (data) => {
    console.log(`${data.minutes}:${data.seconds.toString().padStart(2, '0')}`)
  },
  onComplete: () => {
    console.log('🎉 Time\'s up!')
  }
})

// Control the countdown
countdown.start()   // Start timer
countdown.pause()   // Pause timer  
countdown.resume()  // Resume from pause
countdown.reset()   // Reset to initial time
countdown.restart() // Reset and start immediately
```

### Framework Integration

Since `timekeeper-countdown` is framework-agnostic, you create your own integration layer. We provide complete implementation guides:

#### 📖 **[React Integration Guide](docs/react-integration.md)**
Learn how to create a `useTimekeeper` hook with full TypeScript support.

#### 📖 **[Vue Integration Guide](docs/vue-integration.md)**  
Create a `useTimekeeper` composable for Vue 3 with Composition API.

#### 📖 **[Angular Integration Guide](docs/angular-integration.md)**
Build a `TimekeeperService` with RxJS observables and dependency injection.

### Quick Implementation Examples

<details>
<summary><strong>React Hook (5 minutes to implement)</strong></summary>

```typescript
// hooks/useTimekeeper.ts
import { useEffect, useRef, useState } from 'react'
import { TimekeeperCountdown } from 'timekeeper-countdown'

export function useTimekeeper(initialSeconds: number) {
  const countdownRef = useRef<TimekeeperCountdown | null>(null)
  const [state, setState] = useState({
    totalSeconds: initialSeconds,
    days: 0, hours: 0, minutes: 0, seconds: 0,
    state: 'IDLE' as const
  })

  useEffect(() => {
    countdownRef.current = new TimekeeperCountdown(initialSeconds, {
      onTick: (data) => setState(data),
      onStart: (data) => setState(prev => ({ ...prev, state: data.state })),
      onPause: (data) => setState(prev => ({ ...prev, state: data.state })),
      onComplete: (data) => setState(prev => ({ ...prev, state: data.state })),
    })

    return () => countdownRef.current?.destroy()
  }, [initialSeconds])

  return {
    ...state,
    start: () => countdownRef.current?.start(),
    pause: () => countdownRef.current?.pause(),
    reset: () => countdownRef.current?.reset(),
  }
}
```

Usage:
```jsx
function Timer() {
  const { minutes, seconds, start, pause, state } = useTimekeeper(300)
  
  return (
    <div>
      <div>{minutes}:{seconds.toString().padStart(2, '0')}</div>
      <button onClick={start} disabled={state === 'RUNNING'}>Start</button>
      <button onClick={pause} disabled={state !== 'RUNNING'}>Pause</button>
    </div>
  )
}
```
</details>

<details>
<summary><strong>Vue Composable (5 minutes to implement)</strong></summary>

```typescript
// composables/useTimekeeper.ts
import { ref, onUnmounted } from 'vue'
import { TimekeeperCountdown } from 'timekeeper-countdown'

export function useTimekeeper(initialSeconds: number) {
  const countdown = ref<TimekeeperCountdown | null>(null)
  const totalSeconds = ref(initialSeconds)
  const days = ref(0)
  const hours = ref(0) 
  const minutes = ref(0)
  const seconds = ref(0)
  const state = ref<'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED'>('IDLE')

  // Initialize
  countdown.value = new TimekeeperCountdown(initialSeconds, {
    onTick: (data) => {
      totalSeconds.value = data.totalSeconds
      days.value = data.days
      hours.value = data.hours
      minutes.value = data.minutes  
      seconds.value = data.seconds
      state.value = data.state
    },
    onStart: (data) => state.value = data.state,
    onPause: (data) => state.value = data.state,
    onComplete: (data) => state.value = data.state,
  })

  onUnmounted(() => countdown.value?.destroy())

  return {
    totalSeconds, days, hours, minutes, seconds, state,
    start: () => countdown.value?.start(),
    pause: () => countdown.value?.pause(), 
    reset: () => countdown.value?.reset(),
  }
}
```

Usage:
```vue
<template>
  <div>
    <div>{{ minutes }}:{{ seconds.toString().padStart(2, '0') }}</div>
    <button @click="start" :disabled="state === 'RUNNING'">Start</button>
    <button @click="pause" :disabled="state !== 'RUNNING'">Pause</button>
  </div>
</template>

<script setup>
import { useTimekeeper } from './composables/useTimekeeper'
const { minutes, seconds, start, pause, state } = useTimekeeper(300)
</script>
```
</details>

<details>
<summary><strong>Svelte Store (5 minutes to implement)</strong></summary>

```typescript
// stores/timekeeper.ts
import { writable, derived } from 'svelte/store'
import { TimekeeperCountdown } from 'timekeeper-countdown'

export function createTimekeeperStore(initialSeconds: number) {
  const countdown = new TimekeeperCountdown(initialSeconds)
  
  // Create writable store for timer data
  const timerData = writable({
    totalSeconds: initialSeconds,
    days: 0,
    hours: 0,
    minutes: Math.floor(initialSeconds / 60),
    seconds: initialSeconds % 60,
    state: 'IDLE' as const
  })
  
  // Setup event listeners
  countdown.on('tick', (data) => timerData.set(data))
  countdown.on('start', (data) => timerData.set(data))
  countdown.on('pause', (data) => timerData.set(data))
  countdown.on('complete', (data) => timerData.set(data))
  
  return {
    subscribe: timerData.subscribe,
    start: () => countdown.start(),
    pause: () => countdown.pause(),
    resume: () => countdown.resume(),
    reset: () => countdown.reset(),
    destroy: () => countdown.destroy()
  }
}
```

Usage:
```svelte
<script>
  import { createTimekeeperStore } from './stores/timekeeper'
  import { onDestroy } from 'svelte'
  
  const timer = createTimekeeperStore(300)
  const { minutes, seconds, state } = timer
  
  onDestroy(() => timer.destroy())
</script>

<div>
  <div>{$minutes}:{$seconds.toString().padStart(2, '0')}</div>
  <button on:click={timer.start} disabled={$state === 'RUNNING'}>Start</button>
  <button on:click={timer.pause} disabled={$state !== 'RUNNING'}>Pause</button>
</div>
```
</details>

## Core API

### TimekeeperCountdown Class

```typescript
class TimekeeperCountdown {
  constructor(
    initialSeconds: number,
    options?: {
      autoStart?: boolean
      onTick?: (data: CountdownEventData) => void
      onStart?: (data: CountdownEventData) => void  
      onPause?: (data: CountdownEventData) => void
      onResume?: (data: CountdownEventData) => void
      onReset?: (data: CountdownEventData) => void
      onRestart?: (data: CountdownEventData) => void
      onComplete?: (data: CountdownEventData) => void
    }
  )

  // Properties (getters)
  readonly totalSeconds: number
  readonly days: number
  readonly hours: number      // 0-23  
  readonly minutes: number    // 0-59
  readonly seconds: number    // 0-59
  readonly state: 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED'
  readonly time: CountdownTime // All time properties in one object

  // Methods
  start(): boolean
  pause(): boolean  
  resume(): boolean
  reset(newSeconds?: number): boolean
  restart(newSeconds?: number): boolean
  destroy(): void

  // Event methods
  on(event: CountdownEventType, listener: CountdownEventListener): void
  off(event: CountdownEventType, listener: CountdownEventListener): void
}
```

### State Machine

The countdown follows a predictable finite state machine:

```
IDLE ──start()──→ RUNNING ──pause()──→ PAUSED
 ↑                   │                   │
 │                   │                   │
 └──reset()──────────┘                   │
 ↑                   │                   │
 │                   ↓                   │
 └──────────── COMPLETED ←──resume()─────┘
                     ↑
                     │
                auto-complete
               (when seconds = 0)
```

### Events & Data

Every event receives a `CountdownEventData` object:

```typescript
interface CountdownEventData {
  totalSeconds: number  // Total seconds remaining
  days: number         // Days component  
  hours: number        // Hours component (0-23)
  minutes: number      // Minutes component (0-59)
  seconds: number      // Seconds component (0-59)
  state: CountdownStateType // Current state
}
```

## Advanced Usage

### Multiple Countdown Instances

```typescript
// Create multiple independent countdowns
const workTimer = new TimekeeperCountdown(25 * 60) // 25 minutes
const breakTimer = new TimekeeperCountdown(5 * 60)  // 5 minutes

workTimer.on('complete', () => {
  console.log('Work completed! Time for a break.')
  breakTimer.start()
})

breakTimer.on('complete', () => {
  console.log('Break over! Back to work.')
  workTimer.restart()
})
```

### Dynamic Countdown Updates

```typescript
const countdown = new TimekeeperCountdown(300, {
  onTick: (data) => {
    // Update UI
    document.getElementById('timer').textContent = 
      `${data.minutes}:${data.seconds.toString().padStart(2, '0')}`
    
    // Warning at 10 seconds
    if (data.totalSeconds <= 10) {
      document.body.classList.add('warning')
    }
  },
  onComplete: () => {
    // Play sound, show notification, etc.
    new Audio('/alarm.mp3').play()
  }
})
```

### Persistence & Recovery

```typescript
// Save state to localStorage
const countdown = new TimekeeperCountdown(300, {
  onTick: (data) => {
    localStorage.setItem('countdown-state', JSON.stringify({
      totalSeconds: data.totalSeconds,
      state: data.state
    }))
  }
})

// Restore on page load
const saved = localStorage.getItem('countdown-state')
if (saved) {
  const { totalSeconds, state } = JSON.parse(saved)
  countdown.reset(totalSeconds)
  if (state === 'RUNNING') countdown.start()
}
```

## Utility Functions

The library also exports utility functions for time calculations:

```typescript
import { 
  getDays, 
  getHours, 
  getMinutes, 
  getSeconds,
  getCountdownTime,
  validateInitialSeconds
} from 'timekeeper-countdown'

// Individual calculations
const days = getDays(90061)        // 1 day
const hours = getHours(90061)      // 1 hour  
const minutes = getMinutes(90061)  // 1 minute
const seconds = getSeconds(90061)  // 1 second

// All at once
const time = getCountdownTime(90061)
// { totalSeconds: 90061, days: 1, hours: 1, minutes: 1, seconds: 1 }

// Validation
const validSeconds = validateInitialSeconds(300) // 300 (valid)
validateInitialSeconds(0) // throws Error
```

## Framework Integration Philosophy

**Why don't we provide built-in framework adapters?**

1. **Smaller Bundle** - You only get what you need (~3KB vs ~12KB+ with adapters)
2. **No Dependencies** - Zero peer dependencies means no version conflicts  
3. **Maximum Flexibility** - Implement exactly what your app needs
4. **Better Learning** - Understanding the integration makes you a better developer
5. **Future Proof** - Works with any framework, including ones that don't exist yet

**Implementation is easy** - Our guides show you exactly how to build the perfect adapter for your use case, usually in under 10 minutes.

## Examples & Demos

Check out the `/examples` directory:

- **Vanilla** - Basic HTML/JS integration (`/examples/vanilla/basic.html`)
- **Framework Integrations** - TypeScript examples for React, Vue, Angular, and Svelte (`/examples/integrations/`)

## Migration Guide

### From v0.x (React-only)

```typescript
// Old version (React only)
import { useCountdown } from 'timekeeper-countdown'

// Current version (Framework agnostic)
import { TimekeeperCountdown } from 'timekeeper-countdown'
// + implement your own hook (see React guide)
```

The core functionality is identical, but now you have full control over the integration layer.

## TypeScript Support

This library is built with TypeScript and provides complete type definitions:

```typescript
import type { 
  CountdownTime,
  CountdownStateType, 
  CountdownEventData,
  CountdownEventType,
  CountdownEventListener,
  TimekeeperCountdownOptions
} from 'timekeeper-countdown'
```

## Browser Support

- **Modern Browsers** - ES2020+ (Chrome 80+, Firefox 72+, Safari 13.1+)
- **Node.js** - Version 16+

For older browser support, use a bundler with appropriate polyfills.

## Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

## License

MIT © [Eduardo Kohn](https://www.linkedin.com/in/eduardo-kohn-56817b195/)

---

<div align="center">

**[📖 React Guide](docs/react-integration.md)** • **[📖 Vue Guide](docs/vue-integration.md)** • **[📖 Angular Guide](docs/angular-integration.md)**

</div>