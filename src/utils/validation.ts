import { MIN_SECONDS, MAX_SECONDS } from './constants'

export function validateInitialSeconds(seconds: number): number {
  if (!Number.isInteger(seconds)) {
    throw new Error('Initial seconds must be an integer')
  }

  if (seconds < MIN_SECONDS) {
    throw new Error(`Initial seconds must be at least ${MIN_SECONDS}`)
  }

  if (seconds > MAX_SECONDS) {
    throw new Error(`Initial seconds must be at most ${MAX_SECONDS} (99 days)`)
  }

  return seconds
}

export function isValidState(state: string): boolean {
  const validStates = ['IDLE', 'RUNNING', 'PAUSED', 'COMPLETED']
  return validStates.includes(state)
}