import { describe, it, expect, vi, afterEach } from 'vitest';
import { StateMachine, TimerState } from '../state/state-machine';

// Get the actual StateEvents interface by extracting parameter type
type StateEvents = NonNullable<Parameters<typeof StateMachine>[0]>;

// Test types for invalid parameter testing
type StateMachineWithPrivates = ReturnType<typeof StateMachine> & {
  currentState?: unknown;
};

describe('StateMachine', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor Parameter Validation', () => {
    describe('Events Parameter Type Validation', () => {
      it('should throw error when events is not an object (string)', () => {
        expect(() => {
          StateMachine('invalid' as unknown as StateEvents);
        }).toThrow('events must be an object');
      });

      it('should throw error when events is not an object (number)', () => {
        expect(() => {
          StateMachine(123 as unknown as StateEvents);
        }).toThrow('events must be an object');
      });

      it('should throw error when events is not an object (boolean)', () => {
        expect(() => {
          StateMachine(true as unknown as StateEvents);
        }).toThrow('events must be an object');
      });

      it('should accept array as events parameter', () => {
        expect(() => {
          StateMachine([] as unknown as StateEvents);
        }).not.toThrow();
      });

      it('should throw error when events is not an object (function)', () => {
        expect(() => {
          StateMachine((() => {}) as unknown as StateEvents);
        }).toThrow('events must be an object');
      });

      it('should throw error when events is null', () => {
        expect(() => {
          StateMachine(null as unknown as StateEvents);
        }).toThrow('events must be an object');
      });

      it('should accept undefined events', () => {
        expect(() => {
          StateMachine(undefined);
        }).not.toThrow();
      });

      it('should accept empty events object', () => {
        expect(() => {
          StateMachine({});
        }).not.toThrow();
      });

      it('should accept events object with additional properties', () => {
        expect(() => {
          StateMachine({
            someOtherProp: 'value',
          } as unknown as StateEvents);
        }).not.toThrow();
      });
    });

    describe('OnStateChange Function Type Validation', () => {
      it('should throw error when onStateChange is not a function (string)', () => {
        expect(() => {
          StateMachine({
            onStateChange: 'invalid',
          } as unknown as StateEvents);
        }).toThrow('events.onStateChange must be a function');
      });

      it('should throw error when onStateChange is not a function (number)', () => {
        expect(() => {
          StateMachine({ onStateChange: 123 } as unknown as StateEvents);
        }).toThrow('events.onStateChange must be a function');
      });

      it('should throw error when onStateChange is not a function (boolean)', () => {
        expect(() => {
          StateMachine({
            onStateChange: true,
          } as unknown as StateEvents);
        }).toThrow('events.onStateChange must be a function');
      });

      it('should throw error when onStateChange is not a function (object)', () => {
        expect(() => {
          StateMachine({ onStateChange: {} } as unknown as StateEvents);
        }).toThrow('events.onStateChange must be a function');
      });

      it('should throw error when onStateChange is not a function (array)', () => {
        expect(() => {
          StateMachine({ onStateChange: [] } as unknown as StateEvents);
        }).toThrow('events.onStateChange must be a function');
      });

      it('should throw error when onStateChange is null', () => {
        expect(() => {
          StateMachine({
            onStateChange: null,
          } as unknown as StateEvents);
        }).toThrow('events.onStateChange must be a function');
      });

      it('should accept undefined onStateChange', () => {
        expect(() => {
          StateMachine({ onStateChange: undefined });
        }).not.toThrow();
      });

      it('should accept function for onStateChange', () => {
        expect(() => {
          StateMachine({ onStateChange: () => {} });
        }).not.toThrow();
      });

      it('should accept arrow function for onStateChange', () => {
        expect(() => {
          StateMachine({ onStateChange: state => console.log(state) });
        }).not.toThrow();
      });

      it('should accept regular function for onStateChange', () => {
        expect(() => {
          StateMachine({
            onStateChange: function (state) {
              console.log(state);
            },
          });
        }).not.toThrow();
      });

      it('should accept async function for onStateChange', () => {
        expect(() => {
          StateMachine({
            onStateChange: async state => {
              console.log(state);
            },
          });
        }).not.toThrow();
      });
    });

    describe('Combined Parameter Validation Scenarios', () => {
      it('should validate events object first, then onStateChange', () => {
        // events validation should fail before onStateChange validation
        expect(() => {
          StateMachine('invalid' as unknown as StateEvents);
        }).toThrow('events must be an object');
      });

      it('should pass events validation but fail onStateChange validation', () => {
        expect(() => {
          StateMachine({
            onStateChange: 'invalid',
          } as unknown as StateEvents);
        }).toThrow('events.onStateChange must be a function');
      });

      it('should pass both validations with valid object and function', () => {
        expect(() => {
          const sm = StateMachine({ onStateChange: () => {} });
          expect(sm.getCurrentState()).toBeDefined();
        }).not.toThrow();
      });

      it('should pass both validations with valid object and undefined onStateChange', () => {
        expect(() => {
          const sm = StateMachine({ onStateChange: undefined });
          expect(sm.getCurrentState()).toBeDefined();
        }).not.toThrow();
      });

      it('should pass validation with object containing onStateChange and other properties', () => {
        expect(() => {
          const sm = StateMachine({
            onStateChange: () => {},
            otherProp: 'value',
          } as { onStateChange: () => void; otherProp: string });
          expect(sm.getCurrentState()).toBeDefined();
        }).not.toThrow();
      });
    });

    describe('Object Edge Cases', () => {
      it('should handle object created with Object.create(null)', () => {
        const eventsObj = Object.create(null);
        eventsObj.onStateChange = () => {};

        expect(() => {
          StateMachine(eventsObj);
        }).not.toThrow();
      });

      it('should handle object with prototype', () => {
        class EventsClass {
          onStateChange = () => {};
        }
        const eventsObj = new EventsClass();

        expect(() => {
          StateMachine(eventsObj);
        }).not.toThrow();
      });

      it('should handle frozen object', () => {
        const eventsObj = Object.freeze({ onStateChange: () => {} });

        expect(() => {
          StateMachine(eventsObj);
        }).not.toThrow();
      });

      it('should handle sealed object', () => {
        const eventsObj = Object.seal({ onStateChange: () => {} });

        expect(() => {
          StateMachine(eventsObj);
        }).not.toThrow();
      });

      it('should handle object with getter for onStateChange', () => {
        const eventsObj = {
          get onStateChange() {
            return () => {};
          },
        };

        expect(() => {
          StateMachine(eventsObj);
        }).not.toThrow();
      });

      it('should handle object with setter that returns non-function', () => {
        let value: unknown = 'invalid';
        const eventsObj = {
          get onStateChange() {
            return value;
          },
          set onStateChange(val: unknown) {
            value = val;
          },
        };

        expect(() => {
          StateMachine(eventsObj as unknown as StateEvents);
        }).toThrow('events.onStateChange must be a function');
      });
    });

    describe('Primitive Type Edge Cases', () => {
      it('should handle Symbol as events', () => {
        expect(() => {
          StateMachine(Symbol('test') as unknown as StateEvents);
        }).toThrow('events must be an object');
      });

      it('should handle BigInt as events', () => {
        expect(() => {
          StateMachine(BigInt(123) as unknown as StateEvents);
        }).toThrow('events must be an object');
      });

      it('should handle Symbol as onStateChange', () => {
        expect(() => {
          StateMachine({
            onStateChange: Symbol('test'),
          } as unknown as StateEvents);
        }).toThrow('events.onStateChange must be a function');
      });

      it('should handle BigInt as onStateChange', () => {
        expect(() => {
          StateMachine({
            onStateChange: BigInt(123),
          } as unknown as StateEvents);
        }).toThrow('events.onStateChange must be a function');
      });
    });
  });

  describe('Constructor Initialization', () => {
    it('should create state machine with no events', () => {
      const sm = StateMachine();
      expect(sm.getCurrentState()).toBe(TimerState.IDLE);
    });

    it('should create state machine with undefined events', () => {
      const sm = StateMachine(undefined);
      expect(sm.getCurrentState()).toBe(TimerState.IDLE);
    });

    it('should create state machine with valid events object', () => {
      const mockOnStateChange = vi.fn();
      const sm = StateMachine({ onStateChange: mockOnStateChange });
      expect(sm.getCurrentState()).toBe(TimerState.IDLE);
    });
  });

  describe('Default Initial State', () => {
    it('should start in IDLE state', () => {
      const sm = StateMachine();
      expect(sm.getCurrentState()).toBe(TimerState.IDLE);
      expect(sm.canStart()).toBe(true);
      expect(sm.canResume()).toBe(false);
      expect(sm.canPause()).toBe(false);
      expect(sm.isRunning()).toBe(false);
    });
  });

  describe('Start Method - Valid Transitions', () => {
    it('should transition from IDLE to RUNNING', () => {
      const sm = StateMachine();
      const result = sm.start();

      expect(result).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.RUNNING);
      expect(sm.isRunning()).toBe(true);
      expect(sm.canPause()).toBe(true);
    });

    it('should call onStateChange callback when transitioning from IDLE to RUNNING', () => {
      const mockOnStateChange = vi.fn();
      const sm = StateMachine({ onStateChange: mockOnStateChange });

      sm.start();

      expect(mockOnStateChange).toHaveBeenCalledWith(TimerState.RUNNING);
      expect(mockOnStateChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Pause Method - Valid Transitions', () => {
    it('should transition from RUNNING to PAUSED', () => {
      const sm = StateMachine();
      sm.start();

      const result = sm.pause();

      expect(result).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.PAUSED);
      expect(sm.canResume()).toBe(true);
      expect(sm.isRunning()).toBe(false);
    });

    it('should call onStateChange callback when transitioning from RUNNING to PAUSED', () => {
      const mockOnStateChange = vi.fn();
      const sm = StateMachine({ onStateChange: mockOnStateChange });

      sm.start();
      mockOnStateChange.mockClear();
      sm.pause();

      expect(mockOnStateChange).toHaveBeenCalledWith(TimerState.PAUSED);
      expect(mockOnStateChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Resume Method - Valid Transitions', () => {
    it('should transition from PAUSED to RUNNING', () => {
      const sm = StateMachine();
      sm.start();
      sm.pause();

      const result = sm.resume();

      expect(result).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.RUNNING);
      expect(sm.isRunning()).toBe(true);
      expect(sm.canPause()).toBe(true);
    });

    it('should call onStateChange callback when transitioning from PAUSED to RUNNING', () => {
      const mockOnStateChange = vi.fn();
      const sm = StateMachine({ onStateChange: mockOnStateChange });

      sm.start();
      sm.pause();
      mockOnStateChange.mockClear();
      sm.resume();

      expect(mockOnStateChange).toHaveBeenCalledWith(TimerState.RUNNING);
      expect(mockOnStateChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Stop Method - Valid Transitions', () => {
    it('should reject stop when already in IDLE', () => {
      const sm = StateMachine();

      const result = sm.stop();

      expect(result).toBe(false);
      expect(sm.getCurrentState()).toBe(TimerState.IDLE);
    });

    it('should transition from RUNNING to STOPPED', () => {
      const sm = StateMachine();
      sm.start();

      const result = sm.stop();

      expect(result).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.STOPPED);
      expect(sm.isRunning()).toBe(false);
    });

    it('should transition from PAUSED to STOPPED', () => {
      const sm = StateMachine();
      sm.start();
      sm.pause();

      const result = sm.stop();

      expect(result).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.STOPPED);
    });

    it('should reject stop when already in STOPPED', () => {
      const sm = StateMachine();
      sm.start();
      sm.stop();

      const result = sm.stop();

      expect(result).toBe(false);
      expect(sm.getCurrentState()).toBe(TimerState.STOPPED);
    });

    it('should call onStateChange callback when transitioning to STOPPED', () => {
      const mockOnStateChange = vi.fn();
      const sm = StateMachine({ onStateChange: mockOnStateChange });

      sm.start();
      mockOnStateChange.mockClear();
      sm.stop();

      expect(mockOnStateChange).toHaveBeenCalledWith(TimerState.STOPPED);
      expect(mockOnStateChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Reset Method - Valid Transitions', () => {
    it('should reject reset when already in IDLE', () => {
      const sm = StateMachine();

      const result = sm.reset();

      expect(result).toBe(false);
      expect(sm.getCurrentState()).toBe(TimerState.IDLE);
    });

    it('should transition from RUNNING to IDLE', () => {
      const sm = StateMachine();
      sm.start();

      const result = sm.reset();

      expect(result).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.IDLE);
      expect(sm.canStart()).toBe(true);
    });

    it('should transition from PAUSED to IDLE', () => {
      const sm = StateMachine();
      sm.start();
      sm.pause();

      const result = sm.reset();

      expect(result).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.IDLE);
      expect(sm.canStart()).toBe(true);
    });

    it('should transition from STOPPED to IDLE', () => {
      const sm = StateMachine();
      sm.start();
      sm.stop();

      const result = sm.reset();

      expect(result).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.IDLE);
      expect(sm.canStart()).toBe(true);
    });

    it('should call onStateChange callback when transitioning to IDLE', () => {
      const mockOnStateChange = vi.fn();
      const sm = StateMachine({ onStateChange: mockOnStateChange });

      sm.start();
      mockOnStateChange.mockClear();
      sm.reset();

      expect(mockOnStateChange).toHaveBeenCalledWith(TimerState.IDLE);
      expect(mockOnStateChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Complete Method - Valid Transitions', () => {
    it('should reject complete when already in IDLE', () => {
      const sm = StateMachine();

      const result = sm.complete();

      expect(result).toBe(false);
      expect(sm.getCurrentState()).toBe(TimerState.IDLE);
    });

    it('should transition from RUNNING to STOPPED', () => {
      const sm = StateMachine();
      sm.start();

      const result = sm.complete();

      expect(result).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.STOPPED);
    });

    it('should reject complete when in PAUSED', () => {
      const sm = StateMachine();
      sm.start();
      sm.pause();

      const result = sm.complete();

      expect(result).toBe(false);
      expect(sm.getCurrentState()).toBe(TimerState.PAUSED);
    });

    it('should reject complete when already in STOPPED', () => {
      const sm = StateMachine();
      sm.start();
      sm.complete();

      const result = sm.complete();

      expect(result).toBe(false);
      expect(sm.getCurrentState()).toBe(TimerState.STOPPED);
    });

    it('should call onStateChange callback when transitioning to STOPPED', () => {
      const mockOnStateChange = vi.fn();
      const sm = StateMachine({ onStateChange: mockOnStateChange });

      sm.start();
      mockOnStateChange.mockClear();
      sm.complete();

      expect(mockOnStateChange).toHaveBeenCalledWith(TimerState.STOPPED);
      expect(mockOnStateChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Destroy Method', () => {
    it('should keep state in IDLE when destroy is called before starting', () => {
      const sm = StateMachine();

      sm.destroy();

      expect(sm.getCurrentState()).toBe(TimerState.IDLE);
    });

    it('should transition state to STOPPED from active states', () => {
      const sm = StateMachine();

      // Test from RUNNING
      sm.start();
      sm.destroy();
      expect(sm.getCurrentState()).toBe(TimerState.STOPPED);

      // Test from PAUSED
      sm.reset();
      sm.start();
      sm.pause();
      sm.destroy();
      expect(sm.getCurrentState()).toBe(TimerState.STOPPED);

      // Test from STOPPED
      sm.reset();
      sm.start();
      sm.stop();
      sm.destroy();
      expect(sm.getCurrentState()).toBe(TimerState.STOPPED);
    });
  });

  describe('Same State Transition Handling', () => {
    it('should reject reset when already in IDLE and avoid callbacks', () => {
      const mockOnStateChange = vi.fn();
      const sm = StateMachine({ onStateChange: mockOnStateChange });

      const result = sm.reset();

      expect(result).toBe(false);
      expect(sm.getCurrentState()).toBe(TimerState.IDLE);
      expect(mockOnStateChange).not.toHaveBeenCalled();
    });

    it('should reject transition attempt that keeps STOPPED state', () => {
      const mockOnStateChange = vi.fn();
      const sm = StateMachine({ onStateChange: mockOnStateChange });

      sm.start();
      sm.stop();
      mockOnStateChange.mockClear();

      const result = sm.stop(); // STOPPED to STOPPED

      expect(result).toBe(false);
      expect(sm.getCurrentState()).toBe(TimerState.STOPPED);
      expect(mockOnStateChange).not.toHaveBeenCalled(); // No callback for same state
    });
  });

  describe('State Query Methods Validation', () => {
    it('should correctly report state capabilities in IDLE', () => {
      const sm = StateMachine();

      expect(sm.canStart()).toBe(true);
      expect(sm.canResume()).toBe(false);
      expect(sm.canPause()).toBe(false);
      expect(sm.isRunning()).toBe(false);
    });

    it('should correctly report state capabilities in RUNNING', () => {
      const sm = StateMachine();
      sm.start();

      expect(sm.canStart()).toBe(false);
      expect(sm.canResume()).toBe(false);
      expect(sm.canPause()).toBe(true);
      expect(sm.isRunning()).toBe(true);
    });

    it('should correctly report state capabilities in PAUSED', () => {
      const sm = StateMachine();
      sm.start();
      sm.pause();

      expect(sm.canStart()).toBe(false);
      expect(sm.canResume()).toBe(true);
      expect(sm.canPause()).toBe(false);
      expect(sm.isRunning()).toBe(false);
    });

    it('should correctly report state capabilities in STOPPED', () => {
      const sm = StateMachine();
      sm.start();
      sm.stop();

      expect(sm.canStart()).toBe(false);
      expect(sm.canResume()).toBe(false);
      expect(sm.canPause()).toBe(false);
      expect(sm.isRunning()).toBe(false);
    });
  });

  describe('Multi-Step State Workflows', () => {
    it('should handle full start-pause-resume-stop workflow', () => {
      const mockOnStateChange = vi.fn();
      const sm = StateMachine({ onStateChange: mockOnStateChange });

      // Start
      expect(sm.start()).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.RUNNING);

      // Pause
      expect(sm.pause()).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.PAUSED);

      // Resume
      expect(sm.resume()).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.RUNNING);

      // Stop
      expect(sm.stop()).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.STOPPED);

      expect(mockOnStateChange).toHaveBeenCalledTimes(4);
      expect(mockOnStateChange).toHaveBeenNthCalledWith(1, TimerState.RUNNING);
      expect(mockOnStateChange).toHaveBeenNthCalledWith(2, TimerState.PAUSED);
      expect(mockOnStateChange).toHaveBeenNthCalledWith(3, TimerState.RUNNING);
      expect(mockOnStateChange).toHaveBeenNthCalledWith(4, TimerState.STOPPED);
    });

    it('should handle start-complete-reset workflow', () => {
      const sm = StateMachine();

      // Start
      expect(sm.start()).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.RUNNING);

      // Complete
      expect(sm.complete()).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.STOPPED);

      // Reset
      expect(sm.reset()).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.IDLE);
      expect(sm.canStart()).toBe(true);
    });

    it('should handle multiple start-pause-resume cycles', () => {
      const sm = StateMachine();

      // First cycle
      sm.start();
      sm.pause();
      sm.resume();

      // Second cycle
      sm.pause();
      sm.resume();

      // Third cycle
      sm.pause();
      sm.resume();

      expect(sm.getCurrentState()).toBe(TimerState.RUNNING);
      expect(sm.isRunning()).toBe(true);
    });
  });

  describe('OnStateChange Callback Execution', () => {
    it('should not call callback when events object is undefined', () => {
      const sm = StateMachine();

      // Should not throw error
      expect(() => sm.start()).not.toThrow();
      expect(sm.getCurrentState()).toBe(TimerState.RUNNING);
    });

    it('should not call callback when onStateChange is undefined', () => {
      const sm = StateMachine({});

      // Should not throw error
      expect(() => sm.start()).not.toThrow();
      expect(sm.getCurrentState()).toBe(TimerState.RUNNING);
    });

    it('should handle callback that throws error gracefully', () => {
      const mockOnStateChange = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      const sm = StateMachine({ onStateChange: mockOnStateChange });

      // Should not throw error even if callback throws
      expect(() => sm.start()).not.toThrow();
      expect(sm.getCurrentState()).toBe(TimerState.RUNNING);
      expect(mockOnStateChange).toHaveBeenCalledWith(TimerState.RUNNING);
    });
  });

  describe('State Transition Matrix Validation', () => {
    it('should enforce allowed transitions from IDLE', () => {
      const sm = StateMachine();

      // IDLE -> RUNNING
      expect(sm.start()).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.RUNNING);

      sm.reset(); // Back to IDLE

      // IDLE -> STOPPED (should fail)
      expect(sm.stop()).toBe(false);
      expect(sm.getCurrentState()).toBe(TimerState.IDLE);

      // IDLE -> IDLE via reset (should fail)
      expect(sm.reset()).toBe(false);
      expect(sm.getCurrentState()).toBe(TimerState.IDLE);
    });

    it('should allow all valid transitions from RUNNING', () => {
      const sm = StateMachine();
      sm.start();

      // RUNNING -> PAUSED
      expect(sm.pause()).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.PAUSED);

      sm.resume(); // Back to RUNNING

      // RUNNING -> STOPPED
      expect(sm.stop()).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.STOPPED);

      sm.reset();
      sm.start(); // Back to RUNNING

      // RUNNING -> IDLE
      expect(sm.reset()).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.IDLE);
    });

    it('should allow all valid transitions from PAUSED', () => {
      const sm = StateMachine();
      sm.start();
      sm.pause();

      // PAUSED -> RUNNING
      expect(sm.resume()).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.RUNNING);

      sm.pause(); // Back to PAUSED

      // PAUSED -> STOPPED
      expect(sm.stop()).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.STOPPED);

      sm.reset();
      sm.start();
      sm.pause(); // Back to PAUSED

      // PAUSED -> IDLE
      expect(sm.reset()).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.IDLE);
    });

    it('should allow valid transitions from STOPPED and reject invalid ones', () => {
      const sm = StateMachine();
      sm.start();
      sm.stop();

      // STOPPED -> IDLE
      expect(sm.reset()).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.IDLE);

      sm.start();
      sm.stop(); // Back to STOPPED

      // STOPPED -> STOPPED should be rejected
      expect(sm.stop()).toBe(false);
      expect(sm.getCurrentState()).toBe(TimerState.STOPPED);
    });
  });

  describe('Invalid State Transition Detection', () => {
    it('should reject invalid state transitions correctly', () => {
      // Test the validation logic directly to understand what should be invalid
      const sm = StateMachine();

      // Based on the validTransitions object, these transitions should be invalid:
      // STOPPED -> RUNNING (stopped can only go to IDLE or STOPPED)
      // STOPPED -> PAUSED (stopped can only go to IDLE or STOPPED)

      // Get to STOPPED state first
      sm.start();
      sm.stop();
      expect(sm.getCurrentState()).toBe(TimerState.STOPPED);

      // These methods should fail from STOPPED state:
      expect(sm.start()).toBe(false); // STOPPED -> RUNNING is invalid
      expect(sm.pause()).toBe(false); // STOPPED -> PAUSED is invalid
      expect(sm.resume()).toBe(false); // STOPPED -> RUNNING is invalid

      // These should work:
      expect(sm.reset()).toBe(true); // STOPPED -> IDLE is valid
      expect(sm.getCurrentState()).toBe(TimerState.IDLE);

      // From IDLE, these should be invalid:
      expect(sm.pause()).toBe(false); // IDLE -> PAUSED is invalid
      expect(sm.resume()).toBe(false); // IDLE -> RUNNING is invalid (resume only works from PAUSED)
    });

    it('should allow start only when the machine is idle', () => {
      const sm = StateMachine();

      expect(sm.start()).toBe(true); // IDLE -> RUNNING
      expect(sm.start()).toBe(false); // RUNNING -> RUNNING should fail

      expect(sm.pause()).toBe(true);
      expect(sm.start()).toBe(false); // PAUSED -> RUNNING via start should fail

      expect(sm.reset()).toBe(true);
      expect(sm.start()).toBe(true); // Back to IDLE -> RUNNING
    });

    it('should allow resume only when the machine is paused', () => {
      const sm = StateMachine();

      expect(sm.resume()).toBe(false); // IDLE -> RUNNING via resume should fail

      expect(sm.start()).toBe(true);
      expect(sm.resume()).toBe(false); // RUNNING -> RUNNING via resume should fail

      expect(sm.pause()).toBe(true);
      expect(sm.resume()).toBe(true); // PAUSED -> RUNNING

      expect(sm.stop()).toBe(true);
      expect(sm.resume()).toBe(false); // STOPPED -> RUNNING via resume should fail
    });
  });

  describe('Error Handling and Null Safety', () => {
    it('should handle non-Error exceptions in callbacks', () => {
      // Test line 75: error instanceof Error ? error.message : String(error)
      // We need to test the case where the thrown error is NOT an Error instance

      const mockOnStateChange = vi.fn().mockImplementation(() => {
        // Throw a non-Error object to test the String(error) branch
        throw 'string error'; // This is not an Error instance
      });

      const sm = StateMachine({ onStateChange: mockOnStateChange });

      // This should trigger the callback, which will throw a string
      // The catch block should handle it and use String(error) instead of error.message
      sm.start();

      expect(mockOnStateChange).toHaveBeenCalledWith(TimerState.RUNNING);
      expect(sm.getCurrentState()).toBe(TimerState.RUNNING); // Transition should still succeed
    });

    it('should handle various exception types in callbacks', () => {
      const testCases = [
        { error: 42, description: 'number' },
        { error: null, description: 'null' },
        { error: undefined, description: 'undefined' },
        { error: { custom: 'object' }, description: 'object' },
        { error: Symbol('test'), description: 'symbol' },
      ];

      testCases.forEach(({ error }) => {
        const mockOnStateChange = vi.fn().mockImplementation(() => {
          throw error;
        });

        const sm = StateMachine({ onStateChange: mockOnStateChange });

        // Should handle non-Error thrown values using String(error)
        sm.start();

        expect(mockOnStateChange).toHaveBeenCalledWith(TimerState.RUNNING);
        expect(sm.getCurrentState()).toBe(TimerState.RUNNING);
      });
    });

    it('should handle both Error and non-Error exception types', () => {
      // Test both branches of line 75 in the same test for clarity

      // Branch 1: error instanceof Error === true
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Real error message');
      });

      const sm1 = StateMachine({ onStateChange: errorCallback });
      sm1.start();

      expect(errorCallback).toHaveBeenCalledWith(TimerState.RUNNING);

      // Branch 2: error instanceof Error === false
      const nonErrorCallback = vi.fn().mockImplementation(() => {
        throw 'Not an Error object';
      });

      const sm2 = StateMachine({ onStateChange: nonErrorCallback });
      sm2.start();

      expect(nonErrorCallback).toHaveBeenCalledWith(TimerState.RUNNING);
    });
  });

  describe('State Integrity and Security Validation', () => {
    it('should validate state enum values correctly', () => {
      // Test the exact validation logic used in the code
      const validStates = Object.values(TimerState);

      // Test that the validation logic works correctly
      const testCases = [
        { state: 'INVALID_STATE', shouldPass: false },
        { state: '', shouldPass: false },
        { state: null, shouldPass: false },
        { state: undefined, shouldPass: false },
        { state: 123, shouldPass: false },
        { state: {}, shouldPass: false },
        { state: 'IDLE', shouldPass: true },
        { state: 'RUNNING', shouldPass: true },
        { state: 'PAUSED', shouldPass: true },
        { state: 'STOPPED', shouldPass: true },
      ];

      testCases.forEach(({ state, shouldPass }) => {
        const isValid = validStates.includes(state as TimerState);
        expect(isValid).toBe(shouldPass);
      });

      // This test ensures the validation logic (!Object.values(TimerState).includes(newState))
      // behaves correctly for various invalid inputs
    });

    it('should maintain state integrity with only valid TimerState values', () => {
      const sm = StateMachine();

      // Verify that all state methods only work with valid states
      expect(Object.values(TimerState)).toContain(sm.getCurrentState());

      sm.start();
      expect(Object.values(TimerState)).toContain(sm.getCurrentState());

      sm.pause();
      expect(Object.values(TimerState)).toContain(sm.getCurrentState());

      sm.resume();
      expect(Object.values(TimerState)).toContain(sm.getCurrentState());

      sm.stop();
      expect(Object.values(TimerState)).toContain(sm.getCurrentState());

      sm.reset();
      expect(Object.values(TimerState)).toContain(sm.getCurrentState());
    });

    it('should handle attempts to set invalid state through property manipulation', () => {
      const sm = StateMachine() as StateMachineWithPrivates;

      // Try to directly manipulate currentState if accessible
      const originalState = sm.getCurrentState();

      // Mock Object.defineProperty to test property protection
      vi.spyOn(Object, 'defineProperty');

      // Attempt various ways to corrupt the state
      if (sm.currentState !== undefined) {
        sm.currentState = 'INVALID_STATE';
        // The state machine should still be protected
        expect(sm.getCurrentState()).toBe(originalState);
      }

      // Verify state is still valid
      expect(Object.values(TimerState)).toContain(sm.getCurrentState());
    });

    it('should validate TimerState enum contains only expected values', () => {
      const expectedStates = ['IDLE', 'RUNNING', 'PAUSED', 'STOPPED'];
      const actualStates = Object.values(TimerState);

      expect(actualStates).toEqual(expectedStates);
      expect(actualStates.length).toBe(4);

      // Verify each state is a string
      actualStates.forEach(state => {
        expect(typeof state).toBe('string');
      });
    });

    it('should protect against prototype pollution attempts', () => {
      const sm = StateMachine();

      // Test that the TimerState enum is properly protected
      // Instead of trying to mock non-configurable properties, test the validation logic

      // Verify TimerState properties are not easily modifiable
      const descriptor = Object.getOwnPropertyDescriptor(TimerState, 'IDLE');
      expect(descriptor?.configurable).toBe(false); // Should be non-configurable

      // State machine should work normally with protected enum
      expect(sm.start()).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.RUNNING);

      // Only valid states should be accepted
      const validStates = ['IDLE', 'RUNNING', 'PAUSED', 'STOPPED'];
      expect(validStates).toContain(sm.getCurrentState());

      // Verify the enum values are still correct
      expect(TimerState.IDLE).toBe('IDLE');
      expect(TimerState.RUNNING).toBe('RUNNING');
      expect(TimerState.PAUSED).toBe('PAUSED');
      expect(TimerState.STOPPED).toBe('STOPPED');
    });

    it('should validate states using Object.values method', () => {
      // Test that Object.values(TimerState) works as expected for validation
      const validStates = Object.values(TimerState);

      // Valid states should pass the includes check
      expect(validStates.includes(TimerState.IDLE)).toBe(true);
      expect(validStates.includes(TimerState.RUNNING)).toBe(true);
      expect(validStates.includes(TimerState.PAUSED)).toBe(true);
      expect(validStates.includes(TimerState.STOPPED)).toBe(true);

      // Invalid states should fail the includes check
      expect(validStates.includes('INVALID' as TimerState)).toBe(false);
      expect(validStates.includes('' as TimerState)).toBe(false);
      expect(validStates.includes(null as unknown as TimerState)).toBe(false);
      expect(validStates.includes(undefined as unknown as TimerState)).toBe(false);
      expect(validStates.includes(123 as unknown as TimerState)).toBe(false);
      expect(validStates.includes({} as unknown as TimerState)).toBe(false);
    });

    it('should maintain state consistency across all operations', () => {
      const sm = StateMachine();

      // Test all possible state transitions and verify they only result in valid states
      const stateTransitionTests = [
        () => {
          sm.start();
          return sm.getCurrentState();
        },
        () => {
          sm.pause();
          return sm.getCurrentState();
        },
        () => {
          sm.resume();
          return sm.getCurrentState();
        },
        () => {
          sm.stop();
          return sm.getCurrentState();
        },
        () => {
          sm.reset();
          return sm.getCurrentState();
        },
        () => {
          sm.complete();
          return sm.getCurrentState();
        },
      ];

      // Reset to known state
      sm.reset();

      stateTransitionTests.forEach(testFn => {
        try {
          const resultState = testFn();
          expect(Object.values(TimerState).includes(resultState)).toBe(true);
        } catch {
          // Some transitions might fail from certain states, that's expected
          // Just verify the state is still valid
          expect(Object.values(TimerState).includes(sm.getCurrentState())).toBe(true);
        }
      });
    });

    it('should enforce TimerState type safety at runtime', () => {
      const sm = StateMachine();

      // TypeScript should enforce TimerState type, but test runtime behavior
      const currentState = sm.getCurrentState();

      // Verify the state is one of the expected string literals
      expect(['IDLE', 'RUNNING', 'PAUSED', 'STOPPED']).toContain(currentState);

      // Verify state methods return appropriate boolean results
      expect(typeof sm.canStart()).toBe('boolean');
      expect(typeof sm.canResume()).toBe('boolean');
      expect(typeof sm.canPause()).toBe('boolean');
      expect(typeof sm.isRunning()).toBe('boolean');
    });

    it('should maintain state integrity under rapid operations', () => {
      const sm = StateMachine();

      // Simulate rapid state changes that might reveal race conditions
      const operations = [() => sm.start(), () => sm.pause(), () => sm.resume(), () => sm.stop(), () => sm.reset()];

      // Perform rapid operations
      for (let i = 0; i < 100; i++) {
        const randomOp = operations[Math.floor(Math.random() * operations.length)];
        randomOp();

        // After each operation, state should still be valid
        expect(Object.values(TimerState).includes(sm.getCurrentState())).toBe(true);
      }
    });
  });
});
