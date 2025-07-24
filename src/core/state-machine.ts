import { CountdownState, ActionTypes } from '../utils/constants'
import type { CountdownInternalState as State, CountdownAction } from './types'

export class StateMachine {
  private state: State

  constructor(initialSeconds: number) {
    this.state = {
      seconds: initialSeconds,
      state: CountdownState.IDLE,
    }
  }

  getCurrentState(): State {
    return { ...this.state }
  }

  canTransition(action: CountdownAction): boolean {
    const { type } = action
    const { state } = this.state

    switch (type) {
      case ActionTypes.START:
        return state === CountdownState.IDLE || state === CountdownState.PAUSED
      
      case ActionTypes.PAUSE:
        return state === CountdownState.RUNNING
      
      case ActionTypes.RESET:
        return state !== CountdownState.RUNNING
      
      case ActionTypes.RESTART:
        return state !== CountdownState.IDLE
      
      case ActionTypes.TICK:
        return state === CountdownState.RUNNING
      
      case ActionTypes.COMPLETE:
        return state === CountdownState.RUNNING && this.state.seconds <= 0
      
      default:
        return false
    }
  }

  transition(action: CountdownAction): State | null {
    if (!this.canTransition(action)) {
      return null
    }

    const { type, initialSeconds } = action
    const newState = { ...this.state }

    switch (type) {
      case ActionTypes.START:
        newState.state = CountdownState.RUNNING
        break

      case ActionTypes.PAUSE:
        newState.state = CountdownState.PAUSED
        break

      case ActionTypes.RESET:
        newState.state = CountdownState.IDLE
        if (initialSeconds !== undefined) {
          newState.seconds = initialSeconds
        }
        break

      case ActionTypes.RESTART:
        newState.state = CountdownState.RUNNING
        if (initialSeconds !== undefined) {
          newState.seconds = initialSeconds
        }
        break

      case ActionTypes.TICK:
        // TICK action no longer decrements - time is calculated externally
        break

      case ActionTypes.COMPLETE:
        newState.state = CountdownState.COMPLETED
        newState.seconds = 0
        break
    }

    this.state = newState
    return newState
  }

  reset(initialSeconds: number): void {
    this.state = {
      seconds: initialSeconds,
      state: CountdownState.IDLE,
    }
  }

  setSeconds(seconds: number): void {
    this.state.seconds = seconds
  }
}