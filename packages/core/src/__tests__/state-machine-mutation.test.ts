import { describe, it, expect, vi } from 'vitest';
import { StateMachine, TimerState } from '../state/state-machine';

/**
 * Mutation-focused tests for src/state/state-machine.ts.
 *
 * Each test below pins an OBSERVABLE behavior (return value, getCurrentState(),
 * canX() booleans, or onStateChange invocations) tied to a surviving mutant.
 *
 * NOTE: Several survivors in this file are genuinely EQUIVALENT mutants because
 * the constructs they touch are purely defensive over provably-safe operands
 * (see suspected_equivalent in the report). The tests here lock down the real
 * behavior so any NON-equivalent regression is still caught.
 */
describe('StateMachine - mutation hardening', () => {
  describe('performTransition lookup (line 68 ?.[action])', () => {
    it('returns false and does NOT change state or fire callback for an invalid transition', () => {
      const onStateChange = vi.fn();
      const sm = StateMachine({ onStateChange });

      // From IDLE, "pause"/"resume"/"stop" are invalid -> nextState is undefined.
      expect(sm.pause()).toBe(false);
      expect(sm.resume()).toBe(false);
      expect(sm.stop()).toBe(false);

      expect(sm.getCurrentState()).toBe(TimerState.IDLE);
      expect(onStateChange).not.toHaveBeenCalled();
    });

    it('returns true and changes state for a valid transition', () => {
      const onStateChange = vi.fn();
      const sm = StateMachine({ onStateChange });

      expect(sm.start()).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.RUNNING);
      expect(onStateChange).toHaveBeenCalledExactlyOnceWith(TimerState.RUNNING);
    });
  });

  describe('onStateChange invocation (line 78 events?.onStateChange?.())', () => {
    it('fires the callback with the exact target state on every successful transition', () => {
      const onStateChange = vi.fn();
      const sm = StateMachine({ onStateChange });

      sm.start();
      sm.pause();
      sm.resume();
      sm.stop();

      expect(onStateChange.mock.calls.map(c => c[0])).toEqual([
        TimerState.RUNNING,
        TimerState.PAUSED,
        TimerState.RUNNING,
        TimerState.STOPPED,
      ]);
    });

    it('does not fire the callback when a transition is rejected', () => {
      const onStateChange = vi.fn();
      const sm = StateMachine({ onStateChange });

      sm.start();
      onStateChange.mockClear();

      // RUNNING -> RUNNING via start is invalid.
      expect(sm.start()).toBe(false);
      expect(onStateChange).not.toHaveBeenCalled();
    });

    it('still transitions successfully when no events object is supplied', () => {
      const sm = StateMachine();
      expect(sm.start()).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.RUNNING);
    });

    it('still transitions successfully when onStateChange is omitted', () => {
      const sm = StateMachine({});
      expect(sm.start()).toBe(true);
      expect(sm.getCurrentState()).toBe(TimerState.RUNNING);
    });
  });

  describe('destroy() guard (line 111)', () => {
    it('leaves state untouched and fires no callback when destroyed from IDLE', () => {
      const onStateChange = vi.fn();
      const sm = StateMachine({ onStateChange });

      sm.destroy();

      expect(sm.getCurrentState()).toBe(TimerState.IDLE);
      expect(onStateChange).not.toHaveBeenCalled();
    });

    it('transitions to STOPPED (with one callback) when destroyed from RUNNING', () => {
      const onStateChange = vi.fn();
      const sm = StateMachine({ onStateChange });

      sm.start();
      onStateChange.mockClear();

      sm.destroy();

      expect(sm.getCurrentState()).toBe(TimerState.STOPPED);
      expect(onStateChange).toHaveBeenCalledExactlyOnceWith(TimerState.STOPPED);
    });

    it('transitions to STOPPED when destroyed from PAUSED', () => {
      const sm = StateMachine();
      sm.start();
      sm.pause();

      sm.destroy();

      expect(sm.getCurrentState()).toBe(TimerState.STOPPED);
    });

    it('stays STOPPED and fires no further callback when destroyed from STOPPED', () => {
      const onStateChange = vi.fn();
      const sm = StateMachine({ onStateChange });

      sm.start();
      sm.stop();
      onStateChange.mockClear();

      sm.destroy();

      expect(sm.getCurrentState()).toBe(TimerState.STOPPED);
      expect(onStateChange).not.toHaveBeenCalled();
    });
  });

  describe('capability queries across every state (lines 126-128)', () => {
    it('reports correct canStart/canResume/canPause in IDLE', () => {
      const sm = StateMachine();
      expect(sm.canStart()).toBe(true);
      expect(sm.canResume()).toBe(false);
      expect(sm.canPause()).toBe(false);
    });

    it('reports correct canStart/canResume/canPause in RUNNING', () => {
      const sm = StateMachine();
      sm.start();
      expect(sm.canStart()).toBe(false);
      expect(sm.canResume()).toBe(false);
      expect(sm.canPause()).toBe(true);
    });

    it('reports correct canStart/canResume/canPause in PAUSED', () => {
      const sm = StateMachine();
      sm.start();
      sm.pause();
      expect(sm.canStart()).toBe(false);
      expect(sm.canResume()).toBe(true);
      expect(sm.canPause()).toBe(false);
    });

    it('reports correct canStart/canResume/canPause in STOPPED', () => {
      const sm = StateMachine();
      sm.start();
      sm.stop();
      expect(sm.canStart()).toBe(false);
      expect(sm.canResume()).toBe(false);
      expect(sm.canPause()).toBe(false);
    });
  });
});
