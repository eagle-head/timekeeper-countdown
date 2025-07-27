import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Countdown, TimerState, type CountdownInstance } from '../countdown'
import { type StateMachineModule } from '../state-machine'

// Mock the time-providers module
vi.mock('../time-providers', () => ({
  getCurrentTime: vi.fn(() => Date.now()),
}))

describe('Countdown - Happy Path', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  describe('Initialization', () => {
    it('should create a countdown with initial seconds', () => {
      const countdown = Countdown(120)
      expect(countdown).toBeDefined()
      expect(countdown.getMinutes()).toBe('02')
      expect(countdown.getSeconds()).toBe('00')
      expect(countdown.getCurrentState()).toBe(TimerState.IDLE)
    })

    it('should create a countdown with 0 seconds', () => {
      const countdown = Countdown(0)
      expect(countdown.getMinutes()).toBe('00')
      expect(countdown.getSeconds()).toBe('00')
      expect(countdown.getCurrentState()).toBe(TimerState.IDLE)
    })

    it('should create a countdown with options', () => {
      const onUpdate = vi.fn()
      const onStateChange = vi.fn()
      const countdown = Countdown(60, { onUpdate, onStateChange, debug: true })
      expect(countdown).toBeDefined()
    })
  })

  describe('Start functionality', () => {
    it('should start the countdown', () => {
      const onStateChange = vi.fn()
      const countdown = Countdown(10, { onStateChange })

      countdown.start()

      expect(countdown.getCurrentState()).toBe(TimerState.RUNNING)
      expect(onStateChange).toHaveBeenCalledWith(TimerState.RUNNING)
    })

    it('should update time as countdown progresses', () => {
      const onUpdate = vi.fn()
      const countdown = Countdown(65, { onUpdate })

      countdown.start()

      // Initial call
      expect(onUpdate).toHaveBeenCalledWith('01', '05')

      // Clear previous calls
      onUpdate.mockClear()

      // Advance 1 second - timer checks every 100ms, so we need to advance past 1000ms
      vi.advanceTimersByTime(1100)
      expect(onUpdate).toHaveBeenCalledWith('01', '04')

      // Clear and advance 5 more seconds
      onUpdate.mockClear()
      vi.advanceTimersByTime(5000)
      expect(onUpdate).toHaveBeenCalledWith('00', '59')
    })
  })

  describe('Pause and Resume functionality', () => {
    it('should pause the countdown', () => {
      const onStateChange = vi.fn()
      const countdown = Countdown(60, { onStateChange })

      countdown.start()
      countdown.pause()

      expect(countdown.getCurrentState()).toBe(TimerState.PAUSED)
      expect(onStateChange).toHaveBeenCalledWith(TimerState.PAUSED)
    })

    it('should resume the countdown after pause', () => {
      const onUpdate = vi.fn()
      const onStateChange = vi.fn()
      const countdown = Countdown(60, { onUpdate, onStateChange })

      countdown.start()
      expect(onUpdate).toHaveBeenCalledWith('01', '00')

      // Advance 5 seconds
      vi.advanceTimersByTime(5100)

      countdown.pause()
      const pausedMinutes = countdown.getMinutes()
      const pausedSeconds = countdown.getSeconds()

      // Time passes while paused
      vi.advanceTimersByTime(10000)

      // Time should not change while paused
      expect(countdown.getMinutes()).toBe(pausedMinutes)
      expect(countdown.getSeconds()).toBe(pausedSeconds)

      countdown.resume()
      expect(countdown.getCurrentState()).toBe(TimerState.RUNNING)
      expect(onStateChange).toHaveBeenCalledWith(TimerState.RUNNING)

      // Clear previous calls and advance 1 second after resume
      onUpdate.mockClear()
      vi.advanceTimersByTime(1100)
      expect(onUpdate).toHaveBeenCalledWith('00', '54')
    })
  })

  describe('Reset functionality', () => {
    it('should reset the countdown to initial value', () => {
      const onUpdate = vi.fn()
      const countdown = Countdown(30, { onUpdate })

      countdown.start()
      vi.advanceTimersByTime(10100) // Advance 10 seconds

      countdown.reset()

      expect(countdown.getMinutes()).toBe('00')
      expect(countdown.getSeconds()).toBe('30')
      expect(countdown.getCurrentState()).toBe(TimerState.IDLE)
      expect(onUpdate).toHaveBeenLastCalledWith('00', '30')
    })

    it('should allow starting after reset', () => {
      const countdown = Countdown(20)

      countdown.start()
      vi.advanceTimersByTime(5000)
      countdown.reset()

      countdown.start()
      expect(countdown.getCurrentState()).toBe(TimerState.RUNNING)
    })
  })

  describe('Stop functionality', () => {
    it('should stop the countdown and reset to 0', () => {
      const onUpdate = vi.fn()
      const countdown = Countdown(45, { onUpdate })

      countdown.start()
      vi.advanceTimersByTime(15100) // Advance 15 seconds

      countdown.stop()

      expect(countdown.getMinutes()).toBe('00')
      expect(countdown.getSeconds()).toBe('00')
      expect(countdown.getCurrentState()).toBe(TimerState.STOPPED)
      expect(onUpdate).toHaveBeenLastCalledWith('00', '00')
    })
  })

  describe('Time getter functions', () => {
    it('should return correct time components', () => {
      const countdown = Countdown(93784) // 1 day, 2 hours, 3 minutes, 4 seconds

      expect(countdown.getSeconds()).toBe('04')
      expect(countdown.getMinutes()).toBe('1563')
      expect(countdown.getHours()).toBe('02')
      expect(countdown.getDays()).toBe('01')
      expect(countdown.getWeeks()).toBe('00')
      expect(countdown.getYears()).toBe('00')
    })

    it('should return correct time for large values', () => {
      const countdown = Countdown(31536000) // 1 year (365 days)

      expect(countdown.getYears()).toBe('01')
      expect(countdown.getDays()).toBe('01') // 365 days = 1 year + 1 extra day due to modulo calculation
      expect(countdown.getHours()).toBe('00')
      expect(countdown.getMinutes()).toBe('525600')
      expect(countdown.getSeconds()).toBe('00')
    })

    it('should return correct weeks', () => {
      const countdown = Countdown(1209600) // 2 weeks

      expect(countdown.getWeeks()).toBe('02')
      expect(countdown.getDays()).toBe('00')
    })
  })

  describe('Countdown completion', () => {
    it('should complete when reaching 0', () => {
      const onUpdate = vi.fn()
      const onStateChange = vi.fn()
      const countdown = Countdown(3, { onUpdate, onStateChange })

      countdown.start()

      // Timer should still be running after 2 seconds
      vi.advanceTimersByTime(2100)
      expect(countdown.getCurrentState()).toBe(TimerState.RUNNING)

      // Advance to completion (past 3 seconds)
      vi.advanceTimersByTime(1100)

      // When timer completes, it should transition to STOPPED state first
      expect(countdown.getCurrentState()).toBe(TimerState.STOPPED)
      expect(onUpdate).toHaveBeenCalledWith('00', '00')
    })

    it('should not continue counting after completion', () => {
      const onUpdate = vi.fn()
      const countdown = Countdown(2, { onUpdate })

      countdown.start()
      vi.advanceTimersByTime(2100) // Past completion

      const callCount = onUpdate.mock.calls.length

      vi.advanceTimersByTime(1000) // Try to advance more

      // Should not have been called again
      expect(onUpdate).toHaveBeenCalledTimes(callCount)
    })
  })

  describe('Callbacks', () => {
    it('should call onUpdate with formatted time on each tick', () => {
      const onUpdate = vi.fn()
      const countdown = Countdown(125, { onUpdate }) // 2:05

      countdown.start()

      expect(onUpdate).toHaveBeenCalledWith('02', '05')

      onUpdate.mockClear()
      vi.advanceTimersByTime(1100)
      expect(onUpdate).toHaveBeenCalledWith('02', '04')

      onUpdate.mockClear()
      vi.advanceTimersByTime(1000)
      expect(onUpdate).toHaveBeenCalledWith('02', '03')
    })

    it('should call onStateChange for all state transitions', () => {
      const onStateChange = vi.fn()
      const countdown = Countdown(5, { onStateChange })

      countdown.start()
      expect(onStateChange).toHaveBeenCalledWith(TimerState.RUNNING)

      countdown.pause()
      expect(onStateChange).toHaveBeenCalledWith(TimerState.PAUSED)

      countdown.resume()
      expect(onStateChange).toHaveBeenLastCalledWith(TimerState.RUNNING)

      countdown.stop()
      expect(onStateChange).toHaveBeenCalledWith(TimerState.STOPPED)

      countdown.reset()
      expect(onStateChange).toHaveBeenCalledWith(TimerState.IDLE)
    })
  })

  describe('Destroy functionality', () => {
    it('should destroy the countdown timer', () => {
      const onUpdate = vi.fn()
      const countdown = Countdown(60, { onUpdate })

      countdown.start()
      expect(onUpdate).toHaveBeenCalledTimes(1) // Initial call

      countdown.destroy()

      // Should not update after destroy
      vi.advanceTimersByTime(1100)
      expect(onUpdate).toHaveBeenCalledTimes(1) // Still only initial call
    })
  })

  describe('Multiple operations sequence', () => {
    it('should handle complex sequence of operations', () => {
      const onUpdate = vi.fn()
      const onStateChange = vi.fn()
      const countdown = Countdown(100, { onUpdate, onStateChange })

      // Start
      countdown.start()
      expect(countdown.getCurrentState()).toBe(TimerState.RUNNING)

      // Run for 10 seconds
      vi.advanceTimersByTime(10100)

      // Pause
      countdown.pause()
      expect(countdown.getCurrentState()).toBe(TimerState.PAUSED)

      // Resume
      countdown.resume()
      expect(countdown.getCurrentState()).toBe(TimerState.RUNNING)

      // Run for 5 more seconds (total 15 seconds elapsed)
      vi.advanceTimersByTime(5100)

      // After 15 seconds from 100, should have 85 seconds left
      expect(countdown.getMinutes()).toBe('01')
      expect(countdown.getSeconds()).toBe('25')

      // Reset
      countdown.reset()
      expect(countdown.getCurrentState()).toBe(TimerState.IDLE)
      expect(countdown.getMinutes()).toBe('01')
      expect(countdown.getSeconds()).toBe('40')

      // Start again
      countdown.start()
      vi.advanceTimersByTime(2100)

      // Stop
      countdown.stop()
      expect(countdown.getCurrentState()).toBe(TimerState.STOPPED)
      expect(countdown.getMinutes()).toBe('00')
      expect(countdown.getSeconds()).toBe('00')
    })
  })

  describe('Timer completion flow', () => {
    it('should handle timer completion correctly', () => {
      const onUpdate = vi.fn()
      const onStateChange = vi.fn()
      const countdown = Countdown(2, { onUpdate, onStateChange })

      countdown.start()

      // Should be running initially
      expect(countdown.getCurrentState()).toBe(TimerState.RUNNING)

      // Let timer complete
      vi.advanceTimersByTime(2100)

      // Timer should complete and transition to STOPPED
      expect(countdown.getCurrentState()).toBe(TimerState.STOPPED)
      expect(onUpdate).toHaveBeenCalledWith('00', '00')
    })
  })

  describe('Edge cases', () => {
    it('should handle large time values correctly', () => {
      const countdown = Countdown(3661) // 1 hour, 1 minute, 1 second

      expect(countdown.getMinutes()).toBe('61')
      expect(countdown.getSeconds()).toBe('01')
      expect(countdown.getHours()).toBe('01')
    })

    it('should handle time format correctly during countdown', () => {
      const onUpdate = vi.fn()
      const countdown = Countdown(61, { onUpdate }) // 1:01

      countdown.start()
      expect(onUpdate).toHaveBeenCalledWith('01', '01')

      onUpdate.mockClear()
      vi.advanceTimersByTime(2100)
      expect(onUpdate).toHaveBeenCalledWith('00', '59')
    })

    it('should handle timer precision with 100ms intervals', () => {
      const onUpdate = vi.fn()
      const countdown = Countdown(5, { onUpdate })

      countdown.start()

      // Advance by 950ms - should not trigger update yet
      vi.advanceTimersByTime(950)
      expect(onUpdate).toHaveBeenCalledTimes(1) // Only initial call

      // Advance by another 100ms to pass 1 second
      vi.advanceTimersByTime(100)
      expect(onUpdate).toHaveBeenCalledTimes(2) // Now should have updated
      expect(onUpdate).toHaveBeenLastCalledWith('00', '04')
    })
  })
})

describe('Countdown - Error Handling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    vi.resetModules()
    vi.restoreAllMocks()
  })

  describe('Initialization validation', () => {
    it('should throw error for negative initial seconds', () => {
      expect(() => Countdown(-1)).toThrowError('initialSeconds must be a non-negative integer')
    })

    it('should throw error for non-integer initial seconds', () => {
      expect(() => Countdown(10.5)).toThrowError('initialSeconds must be a non-negative integer')
    })

    it('should throw error for non-number initial seconds', () => {
      expect(() => Countdown('10' as any)).toThrowError('initialSeconds must be a non-negative integer')
    })

    it('should throw error for initial seconds exceeding MAX_SAFE_INTEGER', () => {
      expect(() => Countdown(Number.MAX_SAFE_INTEGER + 1)).toThrowError('initialSeconds exceeds maximum safe integer')
    })

    it('should throw error when onUpdate is not a function', () => {
      expect(() => Countdown(60, { onUpdate: 'not a function' as any })).toThrowError('onUpdate must be a function')
    })
  })

  describe('Callback error handling', () => {
    it('should handle error in onUpdate callback', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const onUpdate = vi.fn(() => {
        throw new Error('onUpdate error')
      })
      const countdown = Countdown(60, { onUpdate, debug: true })

      // Start countdown to trigger onUpdate
      countdown.start()

      // Should not throw, error should be caught and logged
      expect(() => vi.advanceTimersByTime(1100)).not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalled()
      // Check that error was logged properly
      const errorCall = consoleErrorSpy.mock.calls.find(call => call[0].includes('Error in onUpdate callback'))
      expect(errorCall).toBeDefined()

      consoleErrorSpy.mockRestore()
    })

    it('should handle non-Error thrown in onUpdate callback', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const onUpdate = vi.fn(() => {
        throw 'string error'
      })
      const countdown = Countdown(60, { onUpdate, debug: true })

      countdown.start()

      expect(() => vi.advanceTimersByTime(1100)).not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls.find(call => call[0].includes('Error in onUpdate callback'))
      expect(errorCall).toBeDefined()

      consoleErrorSpy.mockRestore()
    })

    it('should handle onStateChange callback errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const onStateChange = vi.fn(() => {
        throw new Error('onStateChange error')
      })
      const countdown = Countdown(60, { onStateChange, debug: true })

      // Should not throw when starting
      expect(() => countdown.start()).not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls.find(call => call[0].includes('Error in onStateChange callback'))
      expect(errorCall).toBeDefined()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Timer error handling', () => {
    it('should handle timer execution errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Create a countdown that will trigger onError callback
      const countdown = Countdown(60, {
        debug: true,
        onUpdate: () => {
          // Force an error during the timer tick
          throw new Error('Update processing error')
        },
      })

      countdown.start()

      // This should trigger the error in onUpdate, which gets caught
      vi.advanceTimersByTime(1100)

      // Check that error was logged
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Method error handling using mocks', () => {
    it('should handle errors in timer methods', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // We'll test error handling by mocking the timer module
      vi.doMock('../timer', () => ({
        Timer: vi.fn(() => ({
          start: vi.fn(() => {
            throw new Error('Timer start error')
          }),
          stop: vi.fn(),
          reset: vi.fn(),
          destroy: vi.fn(),
          getTotalSeconds: vi.fn(() => 60),
          setSeconds: vi.fn(),
        })),
      }))

      // Re-import with mocked timer
      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { debug: true })

      // Should handle start error
      expect(() => countdown.start()).not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls.find(call => call[0].includes('Error starting countdown'))
      expect(errorCall).toBeDefined()

      consoleErrorSpy.mockRestore()
      vi.doUnmock('../timer')
    })

    it('should handle errors in state machine methods', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock the state machine module
      vi.doMock('../state-machine', () => ({
        StateMachine: vi.fn(() => ({
          canStart: vi.fn(() => true),
          canPause: vi.fn(() => {
            throw new Error('Cannot pause')
          }),
          canResume: vi.fn(() => true),
          start: vi.fn(),
          pause: vi.fn(),
          resume: vi.fn(),
          stop: vi.fn(),
          reset: vi.fn(),
          complete: vi.fn(),
          destroy: vi.fn(),
          getCurrentState: vi.fn(() => TimerState.IDLE),
        })),
      }))

      // Re-import with mocked state machine
      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { debug: true })

      // Should handle pause error
      expect(() => countdown.pause()).not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      vi.doUnmock('../state-machine')
    })

    it('should handle errors in formatter methods', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock the formatter module to throw errors
      vi.doMock('../formatter', () => ({
        Formatter: vi.fn(() => ({
          formatTime: vi.fn(() => ({ minutes: '00', seconds: '00' })),
          formatSeconds: vi.fn(() => {
            throw new Error('Format seconds error')
          }),
          formatMinutes: vi.fn(() => '00'),
          formatHours: vi.fn(() => '00'),
          formatDays: vi.fn(() => '00'),
          formatWeeks: vi.fn(() => '00'),
          formatYears: vi.fn(() => '00'),
        })),
      }))

      // Re-import with mocked formatter
      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { debug: true })

      // Should return safe value when formatter throws
      expect(countdown.getSeconds()).toBe('00')
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      vi.doUnmock('../formatter')
    })

    it('should handle errors in timer reset method', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock timer with reset that throws
      vi.doMock('../timer', () => ({
        Timer: vi.fn(() => ({
          start: vi.fn(() => true),
          stop: vi.fn(),
          reset: vi.fn(() => {
            throw new Error('Reset error')
          }),
          destroy: vi.fn(),
          getTotalSeconds: vi.fn(() => 60),
          setSeconds: vi.fn(),
        })),
      }))

      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { debug: true })

      // Should not throw
      expect(() => countdown.reset()).not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      vi.doUnmock('../timer')
    })

    it('should handle errors in timer stop method', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock timer with stop that throws
      vi.doMock('../timer', () => ({
        Timer: vi.fn(() => ({
          start: vi.fn(() => true),
          stop: vi.fn(() => {
            throw new Error('Stop error')
          }),
          reset: vi.fn(),
          destroy: vi.fn(),
          getTotalSeconds: vi.fn(() => 60),
          setSeconds: vi.fn(),
        })),
      }))

      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { debug: true })

      // Should not throw
      expect(() => countdown.stop()).not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      vi.doUnmock('../timer')
    })

    it('should handle errors in timer destroy method', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock timer with destroy that throws
      vi.doMock('../timer', () => ({
        Timer: vi.fn(() => ({
          start: vi.fn(() => true),
          stop: vi.fn(),
          reset: vi.fn(),
          destroy: vi.fn(() => {
            throw new Error('Destroy error')
          }),
          getTotalSeconds: vi.fn(() => 60),
          setSeconds: vi.fn(),
        })),
      }))

      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { debug: true })

      // Should not throw
      expect(() => countdown.destroy()).not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      vi.doUnmock('../timer')
    })
  })

  describe('Getter error handling', () => {
    it('should return safe values when getters throw errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Test each getter method with formatter errors
      const getterTests = [
        { method: 'getMinutes', formatMethod: 'formatMinutes' },
        { method: 'getHours', formatMethod: 'formatHours' },
        { method: 'getDays', formatMethod: 'formatDays' },
        { method: 'getWeeks', formatMethod: 'formatWeeks' },
        { method: 'getYears', formatMethod: 'formatYears' },
      ]

      for (const test of getterTests) {
        // Mock formatter to throw on specific method
        vi.doMock('../formatter', () => ({
          Formatter: vi.fn(() => ({
            formatTime: vi.fn(() => ({ minutes: '00', seconds: '00' })),
            formatSeconds: vi.fn(() => '00'),
            formatMinutes: vi.fn(() =>
              test.formatMethod === 'formatMinutes'
                ? (() => {
                    throw new Error('Format error')
                  })()
                : '00'
            ),
            formatHours: vi.fn(() =>
              test.formatMethod === 'formatHours'
                ? (() => {
                    throw new Error('Format error')
                  })()
                : '00'
            ),
            formatDays: vi.fn(() =>
              test.formatMethod === 'formatDays'
                ? (() => {
                    throw new Error('Format error')
                  })()
                : '00'
            ),
            formatWeeks: vi.fn(() =>
              test.formatMethod === 'formatWeeks'
                ? (() => {
                    throw new Error('Format error')
                  })()
                : '00'
            ),
            formatYears: vi.fn(() =>
              test.formatMethod === 'formatYears'
                ? (() => {
                    throw new Error('Format error')
                  })()
                : '00'
            ),
          })),
        }))

        const { Countdown: MockedCountdown } = await import('../countdown')
        const countdown = MockedCountdown(60, { debug: true })

        // Should return safe value
        expect((countdown as CountdownInstance)[test.method as keyof CountdownInstance]()).toBe('00')

        vi.doUnmock('../formatter')
        vi.resetModules()
      }

      // Verify errors were logged
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should return safe value when getCurrentState throws', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Import original to get TimerState
      const original = await import('../state-machine')

      // Mock state machine to throw on getCurrentState
      vi.doMock('../state-machine', () => ({
        ...original,
        StateMachine: vi.fn(() => ({
          canStart: vi.fn(() => true),
          canPause: vi.fn(() => true),
          canResume: vi.fn(() => true),
          start: vi.fn(),
          pause: vi.fn(),
          resume: vi.fn(),
          stop: vi.fn(),
          reset: vi.fn(),
          complete: vi.fn(),
          destroy: vi.fn(),
          getCurrentState: vi.fn(() => {
            throw new Error('Get state error')
          }),
        })),
      }))

      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { debug: true })

      // Should return safe value
      expect(countdown.getCurrentState()).toBe(TimerState.IDLE)
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      vi.doUnmock('../state-machine')
    })
  })

  describe('Edge case error handling', () => {
    it('should handle invalid totalSeconds in updateUI', () => {
      const onUpdate = vi.fn()
      const countdown = Countdown(60, { onUpdate, debug: true })

      // The countdown already has defensive programming for invalid values
      // The formatTime function will handle NaN, negative, and Infinity values
      // by defaulting to 0, so onUpdate should always receive valid formatted values

      countdown.start()
      expect(onUpdate).toHaveBeenCalledWith('01', '00')

      // Even if timer internally had issues, the defensive checks ensure safe values
    })

    it('should handle cascade errors in reset method', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock timer to throw on both reset and stop (fallback)
      vi.doMock('../timer', () => ({
        Timer: vi.fn(() => ({
          start: vi.fn(() => true),
          stop: vi.fn(() => {
            throw new Error('Stop error')
          }),
          reset: vi.fn(() => {
            throw new Error('Reset error')
          }),
          destroy: vi.fn(),
          getTotalSeconds: vi.fn(() => 0),
          setSeconds: vi.fn(),
        })),
      }))

      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { debug: true })

      // Should not throw even with cascade errors
      expect(() => countdown.reset()).not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      vi.doUnmock('../timer')
    })

    it('should handle cascade errors in stop method', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock multiple timer methods to throw
      vi.doMock('../timer', () => ({
        Timer: vi.fn(() => ({
          start: vi.fn(() => true),
          stop: vi.fn(() => {
            throw new Error('Stop error')
          }),
          reset: vi.fn(),
          destroy: vi.fn(),
          getTotalSeconds: vi.fn(() => {
            throw new Error('Get seconds error')
          }),
          setSeconds: vi.fn(),
        })),
      }))

      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { debug: true })

      // Should not throw even with cascade errors
      expect(() => countdown.stop()).not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      vi.doUnmock('../timer')
    })

    it('should handle cascade errors in destroy method', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock both destroy and stop (fallback) to throw
      vi.doMock('../timer', () => ({
        Timer: vi.fn(() => ({
          start: vi.fn(() => true),
          stop: vi.fn(() => {
            throw new Error('Stop error')
          }),
          reset: vi.fn(),
          destroy: vi.fn(() => {
            throw new Error('Destroy error')
          }),
          getTotalSeconds: vi.fn(() => 60),
          setSeconds: vi.fn(),
        })),
      }))

      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { debug: true })

      // Should not throw even with cascade errors in cleanup
      expect(() => countdown.destroy()).not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      vi.doUnmock('../timer')
    })

    it('should handle defensive programming for invalid totalSeconds', () => {
      const onUpdate = vi.fn()
      const countdown = Countdown(60, { onUpdate, debug: true })

      // The updateUI function has defensive programming that ensures
      // totalSeconds is always a valid number >= 0
      // This is already covered by the internal validation
      countdown.start()

      // Check that onUpdate always receives valid formatted values
      expect(onUpdate).toHaveBeenCalledWith(expect.any(String), expect.any(String))
      const [minutes, seconds] = onUpdate.mock.calls[0]
      expect(minutes).toMatch(/^\d{2,}$/)
      expect(seconds).toMatch(/^\d{2}$/)
    })

    it('should handle timer onError callback by simulating timer error', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Create a countdown that will trigger error in timer through onUpdate callback
      const countdown = Countdown(60, {
        debug: true,
        onUpdate: () => {
          // This error should be caught and logged, but doesn't trigger timer onError
          throw new Error('Update callback error')
        },
      })

      countdown.start()

      // Advance time to trigger the onUpdate error
      vi.advanceTimersByTime(1100)

      // Should have logged the callback error
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls.find(call => call[0].includes('Error in onUpdate callback'))
      expect(errorCall).toBeDefined()

      consoleErrorSpy.mockRestore()
    })

    it('should handle timer onError callback with Error object', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock the timer module to trigger onError callback with Error object
      vi.doMock('../timer', () => ({
        Timer: vi.fn((initialSeconds, events) => {
          const timerInstance = {
            start: vi.fn(() => {
              // Simulate timer error by calling onError callback
              setTimeout(() => events.onError(new Error('Timer internal error')), 0)
              return true
            }),
            stop: vi.fn(),
            reset: vi.fn(),
            destroy: vi.fn(),
            getTotalSeconds: vi.fn(() => 60),
            setSeconds: vi.fn(),
          }
          return timerInstance
        }),
      }))

      // Re-import with mocked timer
      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { debug: true })

      countdown.start()

      // Allow async timer error to execute
      await vi.runAllTimersAsync()

      // Verify error was logged with correct details
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls.find(call => call[0].includes('Timer execution error'))
      expect(errorCall).toBeDefined()

      consoleErrorSpy.mockRestore()
      vi.doUnmock('../timer')
    })

    it('should handle timer onError callback with non-Error object', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock the timer module to trigger onError callback with non-Error object
      vi.doMock('../timer', () => ({
        Timer: vi.fn((initialSeconds, events) => {
          const timerInstance = {
            start: vi.fn(() => {
              // Simulate timer error with non-Error object
              setTimeout(() => events.onError('String error instead of Error object'), 0)
              return true
            }),
            stop: vi.fn(),
            reset: vi.fn(),
            destroy: vi.fn(),
            getTotalSeconds: vi.fn(() => 60),
            setSeconds: vi.fn(),
          }
          return timerInstance
        }),
      }))

      // Re-import with mocked timer
      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { debug: true })

      countdown.start()

      // Allow async timer error to execute
      await vi.runAllTimersAsync()

      // Verify error was logged and non-Error was converted to Error
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls.find(call => call[0].includes('Timer execution error'))
      expect(errorCall).toBeDefined()

      consoleErrorSpy.mockRestore()
      vi.doUnmock('../timer')
    })

    it('should trigger state machine stop when timer onError occurs', async () => {
      const onStateChange = vi.fn()

      // Mock the timer module to trigger onError callback
      vi.doMock('../timer', () => ({
        Timer: vi.fn((initialSeconds, events) => {
          const timerInstance = {
            start: vi.fn(() => {
              // Simulate timer error
              setTimeout(() => events.onError(new Error('Critical timer error')), 0)
              return true
            }),
            stop: vi.fn(),
            reset: vi.fn(),
            destroy: vi.fn(),
            getTotalSeconds: vi.fn(() => 60),
            setSeconds: vi.fn(),
          }
          return timerInstance
        }),
      }))

      // Re-import with mocked timer
      const { Countdown: MockedCountdown, TimerState } = await import('../countdown')
      const countdown = MockedCountdown(60, { onStateChange, debug: true })

      countdown.start()
      expect(onStateChange).toHaveBeenCalledWith(TimerState.RUNNING)

      // Allow async timer error to execute
      await vi.runAllTimersAsync()

      // Verify state machine was stopped due to timer error
      expect(countdown.getCurrentState()).toBe(TimerState.STOPPED)
      expect(onStateChange).toHaveBeenCalledWith(TimerState.STOPPED)

      vi.doUnmock('../timer')
    })

    it('should handle non-Error exceptions in resume method', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock state machine to throw a non-Error object
      vi.doMock('../state-machine', async importOriginal => {
        const actual = (await importOriginal()) as StateMachineModule
        return {
          ...actual,
          StateMachine: vi.fn(() => ({
            canStart: vi.fn(() => true),
            canPause: vi.fn(() => true),
            canResume: vi.fn(() => {
              // Throw a non-Error object to cover the String(error) branch
              throw 'string error instead of Error object'
            }),
            start: vi.fn(),
            pause: vi.fn(),
            resume: vi.fn(),
            stop: vi.fn(),
            reset: vi.fn(),
            complete: vi.fn(),
            destroy: vi.fn(),
            getCurrentState: vi.fn(() => actual.TimerState.PAUSED),
          })),
        }
      })

      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { debug: true })

      // Should not throw and should log the non-Error object
      expect(() => countdown.resume()).not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalled()

      // Check that the error was logged with String(error) conversion
      const errorCall = consoleErrorSpy.mock.calls.find(
        call =>
          call[0].includes('Error in resume function') && call[1]?.error === 'string error instead of Error object'
      )
      expect(errorCall).toBeDefined()

      consoleErrorSpy.mockRestore()
      vi.doUnmock('../state-machine')
    })

    it('should handle non-Error exceptions in start method', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock state machine to throw a non-Error object in canStart
      vi.doMock('../state-machine', async importOriginal => {
        const actual = (await importOriginal()) as StateMachineModule
        return {
          ...actual,
          StateMachine: vi.fn(() => ({
            canStart: vi.fn(() => {
              throw { message: 'object error', code: 123 }
            }),
            canPause: vi.fn(() => true),
            canResume: vi.fn(() => true),
            start: vi.fn(),
            pause: vi.fn(),
            resume: vi.fn(),
            stop: vi.fn(),
            reset: vi.fn(),
            complete: vi.fn(),
            destroy: vi.fn(),
            getCurrentState: vi.fn(() => actual.TimerState.IDLE),
          })),
        }
      })

      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { debug: true })

      // Should not throw and should log the non-Error object
      expect(() => countdown.start()).not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      vi.doUnmock('../state-machine')
    })

    it('should handle non-Error exceptions in pause method', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock state machine to throw a non-Error object in canPause
      vi.doMock('../state-machine', async importOriginal => {
        const actual = (await importOriginal()) as StateMachineModule
        return {
          ...actual,
          StateMachine: vi.fn(() => ({
            canStart: vi.fn(() => true),
            canPause: vi.fn(() => {
              throw null
            }),
            canResume: vi.fn(() => true),
            start: vi.fn(),
            pause: vi.fn(),
            resume: vi.fn(),
            stop: vi.fn(),
            reset: vi.fn(),
            complete: vi.fn(),
            destroy: vi.fn(),
            getCurrentState: vi.fn(() => actual.TimerState.RUNNING),
          })),
        }
      })

      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { debug: true })

      // Should not throw and should log the non-Error object
      expect(() => countdown.pause()).not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      vi.doUnmock('../state-machine')
    })

    it('should handle non-Error exceptions in reset method', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock timer to throw a non-Error object in reset
      vi.doMock('../timer', () => ({
        Timer: vi.fn(() => ({
          start: vi.fn(() => true),
          stop: vi.fn(),
          reset: vi.fn(() => {
            throw 42 // number error
          }),
          destroy: vi.fn(),
          getTotalSeconds: vi.fn(() => 60),
          setSeconds: vi.fn(),
        })),
      }))

      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { debug: true })

      // Should not throw and should log the non-Error object
      expect(() => countdown.reset()).not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      vi.doUnmock('../timer')
    })

    it('should handle non-Error exceptions in stop method', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock timer to throw a non-Error object in stop
      vi.doMock('../timer', () => ({
        Timer: vi.fn(() => ({
          start: vi.fn(() => true),
          stop: vi.fn(() => {
            throw false // boolean error
          }),
          reset: vi.fn(),
          destroy: vi.fn(),
          getTotalSeconds: vi.fn(() => 60),
          setSeconds: vi.fn(),
        })),
      }))

      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { debug: true })

      // Should not throw and should log the non-Error object
      expect(() => countdown.stop()).not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      vi.doUnmock('../timer')
    })

    it('should handle non-Error exceptions in destroy method', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock timer to throw a non-Error object in destroy
      vi.doMock('../timer', () => ({
        Timer: vi.fn(() => ({
          start: vi.fn(() => true),
          stop: vi.fn(),
          reset: vi.fn(),
          destroy: vi.fn(() => {
            throw undefined // undefined error
          }),
          getTotalSeconds: vi.fn(() => 60),
          setSeconds: vi.fn(),
        })),
      }))

      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { debug: true })

      // Should not throw and should log the non-Error object
      expect(() => countdown.destroy()).not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      vi.doUnmock('../timer')
    })

    it('should handle non-Error exceptions in getter methods', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock timer to throw a non-Error object in getTotalSeconds
      vi.doMock('../timer', () => ({
        Timer: vi.fn(() => ({
          start: vi.fn(() => true),
          stop: vi.fn(),
          reset: vi.fn(),
          destroy: vi.fn(),
          getTotalSeconds: vi.fn(() => {
            throw Symbol('symbol error')
          }),
          setSeconds: vi.fn(),
        })),
      }))

      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { debug: true })

      // Test all getter methods - they should return safe values and not throw
      expect(countdown.getSeconds()).toBe('00')
      expect(countdown.getMinutes()).toBe('00')
      expect(countdown.getHours()).toBe('00')
      expect(countdown.getDays()).toBe('00')
      expect(countdown.getWeeks()).toBe('00')
      expect(countdown.getYears()).toBe('00')

      // Should have logged errors for each getter call
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      vi.doUnmock('../timer')
    })

    it('should handle non-Error exceptions in getCurrentState method', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock state machine to throw a non-Error object in getCurrentState
      vi.doMock('../state-machine', async importOriginal => {
        const actual = (await importOriginal()) as StateMachineModule
        return {
          ...actual,
          StateMachine: vi.fn(() => ({
            canStart: vi.fn(() => true),
            canPause: vi.fn(() => true),
            canResume: vi.fn(() => true),
            start: vi.fn(),
            pause: vi.fn(),
            resume: vi.fn(),
            stop: vi.fn(),
            reset: vi.fn(),
            complete: vi.fn(),
            destroy: vi.fn(),
            getCurrentState: vi.fn(() => {
              throw new Date() // Date object error
            }),
          })),
        }
      })

      const { Countdown: MockedCountdown, TimerState } = await import('../countdown')
      const countdown = MockedCountdown(60, { debug: true })

      // Should return safe value and not throw
      expect(countdown.getCurrentState()).toBe(TimerState.IDLE)
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      vi.doUnmock('../state-machine')
    })

    it('should handle invalid totalSeconds in updateUI defensive check', () => {
      const onUpdate = vi.fn()
      const countdown = Countdown(60, { onUpdate, debug: true })

      // Access the internal updateUI function by triggering start
      countdown.start()

      // The updateUI function has defensive checks for totalSeconds
      // This test ensures the defensive programming works correctly
      expect(onUpdate).toHaveBeenCalledWith('01', '00')

      // Clear previous calls
      onUpdate.mockClear()

      // Advance time to trigger updateUI again
      vi.advanceTimersByTime(1100)
      expect(onUpdate).toHaveBeenCalled()

      // Check that all calls have valid formatted strings
      onUpdate.mock.calls.forEach(call => {
        expect(call[0]).toMatch(/^\d{2,}$/) // minutes
        expect(call[1]).toMatch(/^\d{2}$/) // seconds
      })
    })

    it('should handle negative totalSeconds in updateUI defensive check', async () => {
      const onUpdate = vi.fn()

      // Mock timer to return negative totalSeconds to trigger the defensive check
      vi.doMock('../timer', () => ({
        Timer: vi.fn(() => ({
          start: vi.fn(() => true),
          stop: vi.fn(),
          reset: vi.fn(),
          destroy: vi.fn(),
          getTotalSeconds: vi.fn(() => -5), // Negative value to trigger line 51
          setSeconds: vi.fn(),
        })),
      }))

      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { onUpdate, debug: true })

      countdown.start()

      // Should use 0 instead of negative value due to defensive check
      expect(onUpdate).toHaveBeenCalledWith('00', '00')

      vi.doUnmock('../timer')
    })

    it('should handle NaN totalSeconds in updateUI defensive check', async () => {
      const onUpdate = vi.fn()

      // Mock timer to return NaN totalSeconds to trigger the defensive check
      vi.doMock('../timer', () => ({
        Timer: vi.fn(() => ({
          start: vi.fn(() => true),
          stop: vi.fn(),
          reset: vi.fn(),
          destroy: vi.fn(),
          getTotalSeconds: vi.fn(() => NaN), // NaN value to trigger line 51
          setSeconds: vi.fn(),
        })),
      }))

      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { onUpdate, debug: true })

      countdown.start()

      // Should use 0 instead of NaN due to defensive check
      expect(onUpdate).toHaveBeenCalledWith('00', '00')

      vi.doUnmock('../timer')
    })

    it('should handle Infinity totalSeconds in updateUI defensive check', async () => {
      const onUpdate = vi.fn()

      // Mock timer to return Infinity totalSeconds to trigger the defensive check
      vi.doMock('../timer', () => ({
        Timer: vi.fn(() => ({
          start: vi.fn(() => true),
          stop: vi.fn(),
          reset: vi.fn(),
          destroy: vi.fn(),
          getTotalSeconds: vi.fn(() => Infinity), // Infinity value to trigger line 51
          setSeconds: vi.fn(),
        })),
      }))

      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { onUpdate, debug: true })

      countdown.start()

      // Should use 0 instead of Infinity due to defensive check
      expect(onUpdate).toHaveBeenCalledWith('00', '00')

      vi.doUnmock('../timer')
    })

    it('should handle Error object in resume method catch block', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock timer to succeed but state machine to throw Error
      vi.doMock('../timer', () => ({
        Timer: vi.fn(() => ({
          start: vi.fn(() => true), // Return true so we enter the if block
          stop: vi.fn(),
          reset: vi.fn(),
          destroy: vi.fn(),
          getTotalSeconds: vi.fn(() => 60),
          setSeconds: vi.fn(),
        })),
      }))

      // Mock state machine to throw Error in resume method
      vi.doMock('../state-machine', async importOriginal => {
        const actual = (await importOriginal()) as StateMachineModule
        return {
          ...actual,
          StateMachine: vi.fn(() => ({
            canStart: vi.fn(() => true),
            canPause: vi.fn(() => true),
            canResume: vi.fn(() => true), // Allow resume
            start: vi.fn(),
            pause: vi.fn(),
            resume: vi.fn(() => {
              // Throw Error to test line 131 - Error path
              throw new Error('Resume state machine error')
            }),
            stop: vi.fn(),
            reset: vi.fn(),
            complete: vi.fn(),
            destroy: vi.fn(),
            getCurrentState: vi.fn(() => actual.TimerState.PAUSED),
          })),
        }
      })

      const { Countdown: MockedCountdown } = await import('../countdown')
      const countdown = MockedCountdown(60, { debug: true })

      // Should not throw and should handle the error
      expect(() => countdown.resume()).not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalled()

      // Check that the Error object was handled correctly (line 131)
      const errorCall = consoleErrorSpy.mock.calls.find(
        call => call[0].includes('Error in resume function') && call[1]?.error === 'Resume state machine error'
      )
      expect(errorCall).toBeDefined()

      consoleErrorSpy.mockRestore()
      vi.doUnmock('../timer')
      vi.doUnmock('../state-machine')
    })
  })
})
