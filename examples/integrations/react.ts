import { useEffect, useRef, useState, useCallback } from 'react'
import { TimekeeperCountdown } from '../core/timekeeper-countdown'
import type { 
  CountdownTime, 
  CountdownStateType, 
  TimekeeperCountdownOptions 
} from '../core/types'

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