# Examples

## Framework Integration

### Vanilla JavaScript

#### Basic Usage

```javascript
import { Countdown, TimerState } from 'timekeeper-countdown'

// Create a 5-minute countdown (300 seconds)
const timer = Countdown(300, {
  onUpdate: (minutes, seconds) => {
    console.log(`${minutes}:${seconds}`)
  },
  onStateChange: state => {
    console.log(`State: ${state}`)
  },
})

// Control the timer
timer.start() // Start countdown
timer.pause() // Pause timer
timer.resume() // Resume from pause
timer.reset() // Reset to initial time
timer.stop() // Stop timer

// Get current values
timer.getMinutes() // "05"
timer.getSeconds() // "00"
timer.getCurrentState() // "RUNNING"

// Cleanup when done
timer.destroy()
```

#### Simple DOM Example

```html
<div id="timer">05:00</div>
<button onclick="timer.start()">Start</button>
<button onclick="timer.pause()">Pause</button>
<button onclick="timer.reset()">Reset</button>

<script type="module">
  import { Countdown } from 'timekeeper-countdown'

  const timer = Countdown(300, {
    onUpdate: (minutes, seconds) => {
      document.getElementById('timer').textContent = `${minutes}:${seconds}`
    },
  })

  // Make timer globally available for buttons
  window.timer = timer
</script>
```

### React

```javascript
import { useState, useEffect, useRef } from 'react'
import { Countdown, TimerState } from 'timekeeper-countdown'

function useCountdown(initialSeconds, options = {}) {
  const [time, setTime] = useState({ minutes: '00', seconds: '00' })
  const [state, setState] = useState(TimerState.IDLE)
  const countdownRef = useRef(null)

  useEffect(() => {
    countdownRef.current = Countdown(initialSeconds, {
      onUpdate: (minutes, seconds) => setTime({ minutes, seconds }),
      onStateChange: setState,
      ...options,
    })

    // ⚠️ IMPORTANT: Cleanup to prevent memory leaks
    return () => {
      if (countdownRef.current) {
        countdownRef.current.destroy()
      }
    }
  }, [initialSeconds])

  // 🔄 Additional cleanup when page is reloaded
  useEffect(() => {
    const handleBeforeUnload = () => {
      countdownRef.current?.destroy()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const controls = {
    start: () => countdownRef.current?.start(),
    pause: () => countdownRef.current?.pause(),
    resume: () => countdownRef.current?.resume(),
    reset: () => countdownRef.current?.reset(),
    stop: () => countdownRef.current?.stop(),
  }

  return { time, state, controls }
}

// Uso
function Timer() {
  const { time, state, controls } = useCountdown(300) // 5 minutos

  return (
    <div>
      <div>
        {time.minutes}:{time.seconds}
      </div>
      <button onClick={controls.start}>Start</button>
      <button onClick={controls.pause}>Pause</button>
      <button onClick={controls.reset}>Reset</button>
    </div>
  )
}
```

### Angular

```typescript
import { Injectable, Component, OnDestroy, HostListener } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { Countdown, TimerState, CountdownInstance } from 'timekeeper-countdown'

@Injectable()
export class CountdownService implements OnDestroy {
  private countdown: CountdownInstance | null = null

  time$ = new BehaviorSubject({ minutes: '00', seconds: '00' })
  state$ = new BehaviorSubject<TimerState>(TimerState.IDLE)

  constructor() {
    // 🔄 Cleanup when page is reloaded/closed
    window.addEventListener('beforeunload', () => this.cleanup())
    window.addEventListener('unload', () => this.cleanup())
  }

  createCountdown(initialSeconds: number, options = {}) {
    this.countdown = Countdown(initialSeconds, {
      onUpdate: (minutes, seconds) => this.time$.next({ minutes, seconds }),
      onStateChange: state => this.state$.next(state),
      ...options,
    })
  }

  start() {
    this.countdown?.start()
  }
  pause() {
    this.countdown?.pause()
  }
  resume() {
    this.countdown?.resume()
  }
  reset() {
    this.countdown?.reset()
  }
  stop() {
    this.countdown?.stop()
  }

  private cleanup() {
    if (this.countdown) {
      this.countdown.destroy()
      this.countdown = null
    }
  }

  // ⚠️ IMPORTANT: Angular automatic cleanup
  ngOnDestroy() {
    this.cleanup()
  }
}

// Componente
@Component({
  selector: 'app-timer',
  template: `
    <div>
      <div>{{ (countdownService.time$ | async)?.minutes }}:{{ (countdownService.time$ | async)?.seconds }}</div>
      <button (click)="countdownService.start()">Start</button>
      <button (click)="countdownService.pause()">Pause</button>
      <button (click)="countdownService.reset()">Reset</button>
    </div>
  `,
  providers: [CountdownService],
})
export class TimerComponent implements OnDestroy {
  constructor(public countdownService: CountdownService) {
    this.countdownService.createCountdown(300) // 5 minutos
  }

  // 🔄 Additional cleanup in component when leaving page
  @HostListener('window:beforeunload')
  onBeforeUnload() {
    this.countdownService.ngOnDestroy()
  }

  ngOnDestroy() {
    // Service already does cleanup, but ensures here too
    this.countdownService.ngOnDestroy()
  }
}
```

### Vue

```vue
<script setup>
import { ref, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { Countdown, TimerState } from 'timekeeper-countdown'

function useCountdown(initialSeconds, options = {}) {
  const time = ref({ minutes: '00', seconds: '00' })
  const state = ref(TimerState.IDLE)
  let countdown = null

  const createCountdown = () => {
    countdown = Countdown(initialSeconds, {
      onUpdate: (minutes, seconds) => {
        time.value = { minutes, seconds }
      },
      onStateChange: newState => {
        state.value = newState
      },
      ...options,
    })
  }

  const cleanup = () => {
    if (countdown) {
      countdown.destroy()
      countdown = null
    }
  }

  const controls = {
    start: () => countdown?.start(),
    pause: () => countdown?.pause(),
    resume: () => countdown?.resume(),
    reset: () => countdown?.reset(),
    stop: () => countdown?.stop(),
  }

  onMounted(() => {
    createCountdown()

    // 🔄 Cleanup when page is reloaded/closed
    window.addEventListener('beforeunload', cleanup)
    window.addEventListener('unload', cleanup)
  })

  // ⚠️ IMPORTANT: Vue automatic cleanup
  onBeforeUnmount(cleanup)
  onUnmounted(() => {
    cleanup()
    window.removeEventListener('beforeunload', cleanup)
    window.removeEventListener('unload', cleanup)
  })

  return { time, state, controls }
}

// Uso no componente
const { time, state, controls } = useCountdown(300) // 5 minutos
</script>

<template>
  <div>
    <div>{{ time.minutes }}:{{ time.seconds }}</div>
    <button @click="controls.start()">Start</button>
    <button @click="controls.pause()">Pause</button>
    <button @click="controls.reset()">Reset</button>
  </div>
</template>
```

### Svelte

```svelte
<script>
  import { onMount, onDestroy } from 'svelte'
  import { Countdown, TimerState } from 'timekeeper-countdown'

  export let initialSeconds = 300

  let time = { minutes: '00', seconds: '00' }
  let state = TimerState.IDLE
  let countdown = null

  const createCountdown = () => {
    countdown = Countdown(initialSeconds, {
      onUpdate: (minutes, seconds) => {
        time = { minutes, seconds }
      },
      onStateChange: (newState) => {
        state = newState
      }
    })
  }

  const cleanup = () => {
    if (countdown) {
      countdown.destroy()
      countdown = null
    }
  }

  const controls = {
    start: () => countdown?.start(),
    pause: () => countdown?.pause(),
    resume: () => countdown?.resume(),
    reset: () => countdown?.reset(),
    stop: () => countdown?.stop()
  }

  onMount(() => {
    createCountdown()

    // 🔄 Cleanup when page is reloaded/closed
    const handleBeforeUnload = () => cleanup()
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('unload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('unload', handleBeforeUnload)
    }
  })

  // ⚠️ IMPORTANT: Svelte automatic cleanup
  onDestroy(cleanup)
</script>

<div>
  <div>{time.minutes}:{time.seconds}</div>
  <button on:click={controls.start}>Start</button>
  <button on:click={controls.pause}>Pause</button>
  <button on:click={controls.reset}>Reset</button>
</div>
```
