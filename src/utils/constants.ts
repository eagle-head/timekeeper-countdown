export const MIN_SECONDS = 1
export const SECONDS_IN_A_MINUTE = 60
export const SECONDS_IN_AN_HOUR = 3600
export const SECONDS_IN_A_DAY = 86400
export const MAX_SECONDS = 8553600 // 99 days

export const CountdownState = {
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
} as const

export const ActionTypes = {
  START: 'START',
  PAUSE: 'PAUSE',
  RESET: 'RESET',
  TICK: 'TICK',
  COMPLETE: 'COMPLETE',
  RESTART: 'RESTART',
} as const