import { Injectable, OnDestroy } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'
import { TimekeeperCountdown } from '../core/timekeeper-countdown'
import type { 
  CountdownTime, 
  CountdownStateType, 
  TimekeeperCountdownOptions 
} from '../core/types'

export interface TimekeeperState extends CountdownTime {
  state: CountdownStateType
}

@Injectable()
export class TimekeeperService implements OnDestroy {
  private countdown: TimekeeperCountdown | null = null
  private stateSubject = new BehaviorSubject<TimekeeperState>({
    totalSeconds: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    state: 'IDLE' as CountdownStateType,
  })

  public readonly state$: Observable<TimekeeperState> = this.stateSubject.asObservable()

  constructor() {}

  initialize(
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
  ): void {
    // Clean up existing countdown
    if (this.countdown) {
      this.countdown.destroy()
    }

    this.countdown = new TimekeeperCountdown(initialSeconds, {
      ...options,
      onTick: (data) => {
        this.updateState(data)
        options.onTick?.(data)
      },
      onStart: (data) => {
        this.updateState({ ...this.stateSubject.value, state: data.state })
        options.onStart?.(data)
      },
      onPause: (data) => {
        this.updateState({ ...this.stateSubject.value, state: data.state })
        options.onPause?.(data)
      },
      onResume: (data) => {
        this.updateState({ ...this.stateSubject.value, state: data.state })
        options.onResume?.(data)
      },
      onReset: (data) => {
        this.updateState(data)
        options.onReset?.(data)
      },
      onRestart: (data) => {
        this.updateState(data)
        options.onRestart?.(data)
      },
      onComplete: (data) => {
        this.updateState({ ...this.stateSubject.value, state: data.state })
        options.onComplete?.(data)
      },
    })

    // Initialize state
    this.updateState({
      totalSeconds: this.countdown.totalSeconds,
      days: this.countdown.days,
      hours: this.countdown.hours,
      minutes: this.countdown.minutes,
      seconds: this.countdown.seconds,
      state: this.countdown.state,
    })
  }

  start(): boolean {
    return this.countdown?.start() ?? false
  }

  pause(): boolean {
    return this.countdown?.pause() ?? false
  }

  resume(): boolean {
    return this.countdown?.resume() ?? false
  }

  reset(newSeconds?: number): boolean {
    return this.countdown?.reset(newSeconds) ?? false
  }

  restart(newSeconds?: number): boolean {
    return this.countdown?.restart(newSeconds) ?? false
  }

  getCurrentState(): TimekeeperState {
    return this.stateSubject.value
  }

  ngOnDestroy(): void {
    this.countdown?.destroy()
    this.stateSubject.complete()
  }

  private updateState(data: TimekeeperState): void {
    this.stateSubject.next(data)
  }
}

// Factory function for easier usage without Angular DI
export function createTimekeeperService(
  initialSeconds: number,
  options?: Parameters<TimekeeperService['initialize']>[1]
): TimekeeperService {
  const service = new TimekeeperService()
  service.initialize(initialSeconds, options)
  return service
}