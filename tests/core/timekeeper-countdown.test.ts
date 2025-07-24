import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TimekeeperCountdown } from '../../src/core/timekeeper-countdown'

describe('TimekeeperCountdown', () => {
  let countdown: TimekeeperCountdown

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    if (countdown) {
      countdown.destroy()
    }
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('Constructor', () => {
    it('should create countdown with valid initial seconds', () => {
      countdown = new TimekeeperCountdown(60)
      
      expect(countdown.totalSeconds).toBe(60)
      expect(countdown.state).toBe('IDLE')
      expect(countdown.minutes).toBe(1)
      expect(countdown.seconds).toBe(0)
    })

    it('should throw error for invalid initial seconds', () => {
      expect(() => new TimekeeperCountdown(0)).toThrow()
      expect(() => new TimekeeperCountdown(-1)).toThrow()
      expect(() => new TimekeeperCountdown(8553601)).toThrow() // > 99 days
    })

    it('should auto-start when autoStart option is true', () => {
      countdown = new TimekeeperCountdown(60, { autoStart: true })
      
      expect(countdown.state).toBe('RUNNING')
    })
  })

  describe('Time calculations', () => {
    it('should correctly calculate time components', () => {
      countdown = new TimekeeperCountdown(3661) // 1h 1m 1s
      
      expect(countdown.totalSeconds).toBe(3661)
      expect(countdown.hours).toBe(1)
      expect(countdown.minutes).toBe(1)
      expect(countdown.seconds).toBe(1)
      expect(countdown.days).toBe(0)
    })

    it('should correctly calculate days', () => {
      countdown = new TimekeeperCountdown(86461) // 1 day, 1 minute, 1 second
      
      expect(countdown.days).toBe(1)
      expect(countdown.hours).toBe(0)
      expect(countdown.minutes).toBe(1)
      expect(countdown.seconds).toBe(1)
    })
  })

  describe('State transitions', () => {
    beforeEach(() => {
      countdown = new TimekeeperCountdown(10)
    })

    it('should start from IDLE state', () => {
      expect(countdown.start()).toBe(true)
      expect(countdown.state).toBe('RUNNING')
    })

    it('should not start when already running', () => {
      countdown.start()
      expect(countdown.start()).toBe(false)
    })

    it('should pause from RUNNING state', () => {
      countdown.start()
      expect(countdown.pause()).toBe(true)
      expect(countdown.state).toBe('PAUSED')
    })

    it('should not pause when not running', () => {
      expect(countdown.pause()).toBe(false)
    })

    it('should resume from PAUSED state', () => {
      countdown.start()
      countdown.pause()
      expect(countdown.resume()).toBe(true)
      expect(countdown.state).toBe('RUNNING')
    })

    it('should reset from any state except RUNNING', () => {
      expect(countdown.reset()).toBe(true)
      expect(countdown.state).toBe('IDLE')
      expect(countdown.totalSeconds).toBe(10)
    })

    it('should not reset when running', () => {
      countdown.start()
      expect(countdown.reset()).toBe(false)
    })

    it('should restart from any state except IDLE', () => {
      countdown.start()
      countdown.pause()
      expect(countdown.restart()).toBe(true)
      expect(countdown.state).toBe('RUNNING')
    })
  })

  describe('Timer state management', () => {
    it('should maintain timer reference when started', () => {
      countdown = new TimekeeperCountdown(5)
      countdown.start()
      
      expect(countdown.state).toBe('RUNNING')
    })

    it('should clear timer reference when stopped', () => {
      countdown = new TimekeeperCountdown(5)
      countdown.start()
      countdown.pause()
      
      expect(countdown.state).toBe('PAUSED')
    })

    it('should handle multiple start/stop cycles', () => {
      countdown = new TimekeeperCountdown(5)
      
      countdown.start()
      expect(countdown.state).toBe('RUNNING')
      
      countdown.pause()
      expect(countdown.state).toBe('PAUSED')
      
      countdown.resume()
      expect(countdown.state).toBe('RUNNING')
    })
  })

  describe('Event system', () => {
    it('should register event listeners via options', () => {
      const onStart = vi.fn()
      countdown = new TimekeeperCountdown(10, { onStart })
      
      countdown.start()
      
      expect(onStart).toHaveBeenCalledWith(
        expect.objectContaining({
          totalSeconds: 10,
          state: 'RUNNING'
        })
      )
    })

    it('should allow adding/removing event listeners', () => {
      const listener = vi.fn()
      countdown = new TimekeeperCountdown(10)
      
      countdown.on('start', listener)
      countdown.start()
      expect(listener).toHaveBeenCalled()
      
      listener.mockClear()
      countdown.off('start', listener)
      countdown.reset()
      countdown.start()
      expect(listener).not.toHaveBeenCalled()
    })

    it('should emit events with correct data structure', () => {
      const onStart = vi.fn()
      countdown = new TimekeeperCountdown(3661, { onStart }) // 1h 1m 1s
      
      countdown.start()
      
      expect(onStart).toHaveBeenCalledWith(
        expect.objectContaining({
          days: 0,
          hours: 1,
          minutes: 1,
          seconds: 1,
          totalSeconds: 3661,
          state: 'RUNNING'
        })
      )
    })

    it('should clean up event listeners on destroy', () => {
      const onStart = vi.fn()
      countdown = new TimekeeperCountdown(10, { onStart })
      
      countdown.destroy()
      countdown.start()
      
      expect(onStart).not.toHaveBeenCalled()
    })
  })

  describe('Reset and restart with new values', () => {
    beforeEach(() => {
      countdown = new TimekeeperCountdown(10)
    })

    it('should reset with new initial seconds', () => {
      countdown.reset(20)
      
      expect(countdown.totalSeconds).toBe(20)
      expect(countdown.state).toBe('IDLE')
    })

    it('should restart with new initial seconds', () => {
      countdown.start()
      countdown.pause()
      countdown.restart(30)
      
      expect(countdown.totalSeconds).toBe(30)
      expect(countdown.state).toBe('RUNNING')
    })
  })

  describe('Cleanup', () => {
    it('should destroy countdown instance properly', () => {
      countdown = new TimekeeperCountdown(10)
      countdown.start()
      
      expect(() => countdown.destroy()).not.toThrow()
      expect(countdown.state).toBe('RUNNING') // State remains as-is after destroy
    })
  })
})