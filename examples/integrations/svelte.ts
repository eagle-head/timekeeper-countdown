// Svelte Integration Example
// This file demonstrates how to integrate timekeeper-countdown with Svelte

import { writable, type Readable } from 'svelte/store'
import { TimekeeperCountdown } from '../../src'
import type { 
  CountdownTime, 
  CountdownStateType, 
  TimekeeperCountdownOptions 
} from '../../src'

export interface SvelteTimekeeperStore extends CountdownTime {
  state: CountdownStateType
}

export interface SvelteTimekeeperActions {
  start: () => boolean
  pause: () => boolean
  resume: () => boolean
  reset: (newSeconds?: number) => boolean
  restart: (newSeconds?: number) => boolean
  destroy: () => void
}

/**
 * Creates a Svelte store for managing countdown functionality
 * 
 * @param initialSeconds - Initial countdown duration in seconds
 * @param options - Configuration options for the countdown
 * @returns Object with subscribe method for the store and actions for controlling the countdown
 * 
 * @example
 * ```typescript
 * // In your Svelte component
 * import { createSvelteTimekeeper } from './timekeeper-svelte'
 * 
 * const { subscribe, actions } = createSvelteTimekeeper(300, {
 *   onComplete: () => alert('Time is up!')
 * })
 * 
 * // Use in template: $timekeeper.totalSeconds, $timekeeper.state, etc.
 * // Control with: actions.start(), actions.pause(), etc.
 * ```
 */
export function createSvelteTimekeeper(
  initialSeconds: number,
  options: TimekeeperCountdownOptions = {}
): { 
  subscribe: Readable<SvelteTimekeeperStore>['subscribe']
  actions: SvelteTimekeeperActions
} {
  let countdown: TimekeeperCountdown | null = null
  
  // Initialize store with initial state
  const store = writable<SvelteTimekeeperStore>({
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

  const actions: SvelteTimekeeperActions = {
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

/**
 * Example usage in a Svelte component:
 * 
 * ```svelte
 * <script lang="ts">
 *   import { onDestroy } from 'svelte'
 *   import { createSvelteTimekeeper } from './timekeeper-svelte'
 * 
 *   const { subscribe, actions } = createSvelteTimekeeper(300, {
 *     onComplete: () => {
 *       console.log('Countdown completed!')
 *     }
 *   })
 * 
 *   $: timekeeper = subscribe
 * 
 *   onDestroy(() => {
 *     actions.destroy()
 *   })
 * </script>
 * 
 * <div>
 *   <h1>Countdown: {$timekeeper.totalSeconds}s</h1>
 *   <p>State: {$timekeeper.state}</p>
 *   <button on:click={actions.start}>Start</button>
 *   <button on:click={actions.pause}>Pause</button>
 *   <button on:click={actions.resume}>Resume</button>
 *   <button on:click={() => actions.reset()}>Reset</button>
 * </div>
 * ```
 */