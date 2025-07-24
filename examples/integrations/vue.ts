import { ref, onUnmounted, watch, type Ref } from 'vue'
import { TimekeeperCountdown } from '../core/timekeeper-countdown'
import type { 
  CountdownTime, 
  CountdownStateType, 
  TimekeeperCountdownOptions 
} from '../core/types'

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