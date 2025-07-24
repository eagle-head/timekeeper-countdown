import { CountdownState, ActionTypes } from '../utils/constants'

export type CountdownStateType = typeof CountdownState[keyof typeof CountdownState]
export type ActionType = typeof ActionTypes[keyof typeof ActionTypes]

export interface CountdownTime {
  totalSeconds: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

export interface CountdownInternalState {
  seconds: number
  state: CountdownStateType
}

export interface CountdownAction {
  type: ActionType
  initialSeconds?: number
}

export interface CountdownEventData extends CountdownTime {
  state: CountdownStateType
}

export type CountdownEventType = 
  | 'tick'
  | 'start'
  | 'pause'
  | 'resume'
  | 'reset'
  | 'restart'
  | 'complete'

export type CountdownEventListener = (data: CountdownEventData) => void

export interface TimekeeperCountdownOptions {
  autoStart?: boolean
  onTick?: CountdownEventListener
  onComplete?: CountdownEventListener
  onStart?: CountdownEventListener
  onPause?: CountdownEventListener
  onResume?: CountdownEventListener
  onReset?: CountdownEventListener
  onRestart?: CountdownEventListener
}