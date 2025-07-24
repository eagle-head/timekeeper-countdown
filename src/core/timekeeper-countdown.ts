import { ActionTypes, CountdownState } from '../utils/constants'
import { validateInitialSeconds } from '../utils/validation'
import { getCountdownTime } from '../utils/time'
import { EventEmitter } from './event-emitter'
import { StateMachine } from './state-machine'
import type {
  CountdownTime,
  CountdownStateType,
  CountdownEventData,
  TimekeeperCountdownOptions,
  CountdownEventType,
  CountdownEventListener,
} from './types'

export class TimekeeperCountdown {
  private initialSeconds: number
  private stateMachine: StateMachine
  private eventEmitter: EventEmitter
  private timerId: NodeJS.Timeout | number | null = null
  private startTimestamp: number = 0
  private pausedDuration: number = 0
  private pauseTimestamp: number = 0
  private targetUpdateRate: number = 50
  
  // Cross-platform timer functions
  private setTimeout(callback: () => void, delay: number): NodeJS.Timeout | number {
    return typeof window !== 'undefined' 
      ? window.setTimeout(callback, delay)
      : setTimeout(callback, delay)
  }
  
  private clearTimeout(id: NodeJS.Timeout | number): void {
    if (typeof window !== 'undefined') {
      window.clearTimeout(id as number)
    } else {
      clearTimeout(id as NodeJS.Timeout)
    }
  }


  constructor(
    initialSeconds: number,
    options: TimekeeperCountdownOptions = {}
  ) {
    this.initialSeconds = validateInitialSeconds(initialSeconds)
    this.stateMachine = new StateMachine(this.initialSeconds)
    this.eventEmitter = new EventEmitter()

    // Register event listeners from options
    if (options.onTick) this.eventEmitter.on('tick', options.onTick)
    if (options.onStart) this.eventEmitter.on('start', options.onStart)
    if (options.onPause) this.eventEmitter.on('pause', options.onPause)
    if (options.onResume) this.eventEmitter.on('resume', options.onResume)
    if (options.onReset) this.eventEmitter.on('reset', options.onReset)
    if (options.onRestart) this.eventEmitter.on('restart', options.onRestart)
    if (options.onComplete) this.eventEmitter.on('complete', options.onComplete)

    // Auto-start if specified
    if (options.autoStart) {
      this.start()
    }
  }

  // Getters for current state
  get totalSeconds(): number {
    return this.calculateRemainingSeconds()
  }

  get days(): number {
    return getCountdownTime(this.totalSeconds).days
  }

  get hours(): number {
    return getCountdownTime(this.totalSeconds).hours
  }

  get minutes(): number {
    return getCountdownTime(this.totalSeconds).minutes
  }

  get seconds(): number {
    return getCountdownTime(this.totalSeconds).seconds
  }

  get state(): CountdownStateType {
    return this.stateMachine.getCurrentState().state
  }

  get time(): CountdownTime {
    return getCountdownTime(this.totalSeconds)
  }

  // Event methods
  on(event: CountdownEventType, listener: CountdownEventListener): void {
    this.eventEmitter.on(event, listener)
  }

  off(event: CountdownEventType, listener: CountdownEventListener): void {
    this.eventEmitter.off(event, listener)
  }

  // Control methods
  start(): boolean {
    const newState = this.stateMachine.transition({ type: ActionTypes.START })
    if (!newState) return false

    this.startTimer()
    this.emitEvent('start')
    return true
  }

  pause(): boolean {
    if (this.state !== CountdownState.RUNNING) return false

    this.pauseTimestamp = performance.now()
    this.stopTimer()

    const newState = this.stateMachine.transition({ type: ActionTypes.PAUSE })
    if (!newState) return false

    this.emitEvent('pause')
    return true
  }

  resume(): boolean {
    return this.start() // Resume is the same as start for paused state
  }

  reset(newInitialSeconds?: number): boolean {
    const resetSeconds =
      newInitialSeconds !== undefined
        ? validateInitialSeconds(newInitialSeconds)
        : this.initialSeconds

    const newState = this.stateMachine.transition({
      type: ActionTypes.RESET,
      initialSeconds: resetSeconds,
    })

    if (!newState) return false

    this.stopTimer()

    if (newInitialSeconds !== undefined) {
      this.initialSeconds = resetSeconds
    }

    this.emitEvent('reset')
    return true
  }

  restart(newInitialSeconds?: number): boolean {
    const restartSeconds =
      newInitialSeconds !== undefined
        ? validateInitialSeconds(newInitialSeconds)
        : this.initialSeconds

    const newState = this.stateMachine.transition({
      type: ActionTypes.RESTART,
      initialSeconds: restartSeconds,
    })

    if (!newState) return false

    if (newInitialSeconds !== undefined) {
      this.initialSeconds = restartSeconds
    }

    this.startTimer()
    this.emitEvent('restart')
    return true
  }

  destroy(): void {
    this.stopTimer()
    this.eventEmitter.removeAllListeners()
  }

  // Private methods
  private startTimer(): void {
    this.stopTimer() // Clear any existing timer

    if (
      this.state === CountdownState.IDLE ||
      this.state === CountdownState.COMPLETED
    ) {
      this.startTimestamp = performance.now()
      this.pausedDuration = 0
    } else if (this.state === CountdownState.PAUSED) {
      // Resuming: add paused time to total paused duration
      this.pausedDuration += performance.now() - this.pauseTimestamp
    }

    this.scheduleNextUpdate()
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      this.clearTimeout(this.timerId)
      this.timerId = null
    }
  }

  private scheduleNextUpdate(): void {
    const remainingSeconds = this.calculateRemainingSeconds()

    if (remainingSeconds <= 0) {
      this.complete()
      return
    }

    // Calculate exact time until next second boundary
    const currentTime = performance.now()
    const elapsedTime = currentTime - this.startTimestamp - this.pausedDuration
    const msUntilNextSecond = 1000 - (elapsedTime % 1000)

    // Calculate delay - be more aggressive for the final second
    let delay: number
    if (remainingSeconds <= 1) {
      // For the last second, use a more frequent update rate to ensure completion
      delay = Math.min(msUntilNextSecond, this.targetUpdateRate, 25)
    } else {
      delay = Math.max(msUntilNextSecond, this.targetUpdateRate)
    }

    this.timerId = this.setTimeout(
      () => {
        this.tick()
        this.scheduleNextUpdate() // Schedule next update
      },
      delay
    )
  }

  private calculateRemainingSeconds(): number {
    const currentState = this.stateMachine.getCurrentState()

    if (currentState.state === CountdownState.IDLE) {
      return this.initialSeconds
    }

    if (currentState.state === CountdownState.COMPLETED) {
      return 0
    }

    if (currentState.state === CountdownState.PAUSED) {
      const elapsedBeforePause =
        this.pauseTimestamp - this.startTimestamp - this.pausedDuration
      return Math.max(
        0,
        this.initialSeconds - Math.floor(elapsedBeforePause / 1000)
      )
    }

    const currentTime = performance.now()
    const elapsedTime = currentTime - this.startTimestamp - this.pausedDuration
    return Math.max(0, this.initialSeconds - Math.floor(elapsedTime / 1000))
  }

  private tick(): void {
    const remainingSeconds = this.calculateRemainingSeconds()

    // Update state machine with calculated time
    this.stateMachine.setSeconds(remainingSeconds)
    this.emitEvent('tick')

    if (remainingSeconds <= 0) {
      this.complete()
    }
  }

  private complete(): void {
    const newState = this.stateMachine.transition({
      type: ActionTypes.COMPLETE,
    })
    if (!newState) return

    this.stopTimer()
    this.emitEvent('complete')
  }

  private emitEvent(eventType: Parameters<EventEmitter['emit']>[0]): void {
    const eventData: CountdownEventData = {
      ...this.time,
      state: this.state,
    }

    this.eventEmitter.emit(eventType, eventData)
  }
}
