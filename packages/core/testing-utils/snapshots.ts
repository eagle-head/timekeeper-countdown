import type { CountdownSnapshot, CountdownParts } from '../src/api/countdown-engine'
import { TimerState } from '../src/state/state-machine'

export interface SnapshotOptions {
  initialSeconds?: number
  totalSeconds?: number
  state?: TimerState
}

const clampSeconds = (value: number | undefined): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0
  }

  if (value <= 0) {
    return 0
  }

  if (value >= Number.MAX_SAFE_INTEGER) {
    return Number.MAX_SAFE_INTEGER
  }
  return Math.floor(value)
}

const computeParts = (totalSeconds: number): CountdownParts => {
  const safeSeconds = clampSeconds(totalSeconds)
  const years = Math.floor(safeSeconds / 31536000)
  const weeks = Math.floor(safeSeconds / 604800) % 52
  const days = Math.floor(safeSeconds / 86400) % 7
  const hours = Math.floor(safeSeconds / 3600) % 24
  const minutes = Math.floor(safeSeconds / 60) % 60
  const seconds = safeSeconds % 60

  const totalDays = Math.floor(safeSeconds / 86400)
  const totalHours = Math.floor(safeSeconds / 3600)
  const totalMinutes = Math.floor(safeSeconds / 60)

  return {
    years,
    weeks,
    days,
    hours,
    minutes,
    seconds,
    totalDays,
    totalHours,
    totalMinutes,
  }
}

export function buildSnapshot(options: SnapshotOptions = {}): CountdownSnapshot {
  const initialSeconds = clampSeconds(options.initialSeconds ?? options.totalSeconds ?? 0)
  const totalSeconds = clampSeconds(options.totalSeconds ?? options.initialSeconds ?? 0)
  const state = options.state ?? (totalSeconds > 0 ? TimerState.IDLE : TimerState.STOPPED)
  const parts = computeParts(totalSeconds)
  return {
    initialSeconds,
    totalSeconds,
    parts,
    state,
    isRunning: state === TimerState.RUNNING,
    isCompleted: totalSeconds === 0 && state === TimerState.STOPPED,
  }
}

export interface SequenceOptions extends SnapshotOptions {
  step?: number
  count?: number
}

export function buildSnapshotSequence(options: SequenceOptions = {}): CountdownSnapshot[] {
  const { totalSeconds = 0, step = 1, count = 1, initialSeconds } = options
  const safeTotal = clampSeconds(totalSeconds)
  const safeStep = clampSeconds(step)
  const safeCount = clampSeconds(count) || 1
  const snapshots: CountdownSnapshot[] = []

  for (let index = 0; index < safeCount; index += 1) {
    const remaining = Math.max(safeTotal - safeStep * index, 0)
    snapshots.push(
      buildSnapshot({
        initialSeconds: initialSeconds ?? safeTotal,
        totalSeconds: remaining,
        state: remaining === 0 ? TimerState.STOPPED : TimerState.RUNNING,
      })
    )
  }

  return snapshots
}

export { TimerState }
