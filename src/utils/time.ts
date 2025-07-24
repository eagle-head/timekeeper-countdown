import {
  SECONDS_IN_A_DAY,
  SECONDS_IN_AN_HOUR,
  SECONDS_IN_A_MINUTE,
} from './constants'
import type { CountdownTime } from '../core/types'

export function getDays(totalSeconds: number): number {
  return Math.floor(totalSeconds / SECONDS_IN_A_DAY)
}

export function getHours(totalSeconds: number): number {
  return Math.floor((totalSeconds % SECONDS_IN_A_DAY) / SECONDS_IN_AN_HOUR)
}

export function getMinutes(totalSeconds: number): number {
  return Math.floor((totalSeconds % SECONDS_IN_AN_HOUR) / SECONDS_IN_A_MINUTE)
}

export function getSeconds(totalSeconds: number): number {
  return totalSeconds % SECONDS_IN_A_MINUTE
}

export function getCountdownTime(totalSeconds: number): CountdownTime {
  return {
    totalSeconds,
    days: getDays(totalSeconds),
    hours: getHours(totalSeconds),
    minutes: getMinutes(totalSeconds),
    seconds: getSeconds(totalSeconds),
  }
}