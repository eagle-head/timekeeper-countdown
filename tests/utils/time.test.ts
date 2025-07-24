import { describe, it, expect } from 'vitest'
import { getDays, getHours, getMinutes, getSeconds, getCountdownTime } from '../../src/utils/time'

describe('Time utilities', () => {
  describe('getDays', () => {
    it('should return correct days', () => {
      expect(getDays(86400)).toBe(1) // 1 day
      expect(getDays(172800)).toBe(2) // 2 days
      expect(getDays(3600)).toBe(0) // 1 hour
      expect(getDays(0)).toBe(0)
    })
  })

  describe('getHours', () => {
    it('should return correct hours (0-23)', () => {
      expect(getHours(3600)).toBe(1) // 1 hour
      expect(getHours(7200)).toBe(2) // 2 hours
      expect(getHours(86400)).toBe(0) // 1 day = 0 hours remaining
      expect(getHours(90000)).toBe(1) // 1 day + 1 hour
      expect(getHours(3661)).toBe(1) // 1 hour, 1 minute, 1 second
    })
  })

  describe('getMinutes', () => {
    it('should return correct minutes (0-59)', () => {
      expect(getMinutes(60)).toBe(1) // 1 minute
      expect(getMinutes(120)).toBe(2) // 2 minutes
      expect(getMinutes(3600)).toBe(0) // 1 hour = 0 minutes remaining
      expect(getMinutes(3660)).toBe(1) // 1 hour + 1 minute
      expect(getMinutes(3661)).toBe(1) // 1 hour, 1 minute, 1 second
    })
  })

  describe('getSeconds', () => {
    it('should return correct seconds (0-59)', () => {
      expect(getSeconds(1)).toBe(1) // 1 second
      expect(getSeconds(59)).toBe(59) // 59 seconds
      expect(getSeconds(60)).toBe(0) // 1 minute = 0 seconds remaining
      expect(getSeconds(61)).toBe(1) // 1 minute + 1 second
      expect(getSeconds(3661)).toBe(1) // 1 hour, 1 minute, 1 second
    })
  })

  describe('getCountdownTime', () => {
    it('should return complete time breakdown', () => {
      const time = getCountdownTime(90061) // 1 day, 1 hour, 1 minute, 1 second
      
      expect(time).toEqual({
        totalSeconds: 90061,
        days: 1,
        hours: 1,
        minutes: 1,
        seconds: 1
      })
    })

    it('should handle edge cases', () => {
      const time = getCountdownTime(0)
      
      expect(time).toEqual({
        totalSeconds: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
      })
    })

    it('should handle large values', () => {
      const time = getCountdownTime(8553600) // 99 days
      
      expect(time).toEqual({
        totalSeconds: 8553600,
        days: 99,
        hours: 0,
        minutes: 0,
        seconds: 0
      })
    })
  })
})