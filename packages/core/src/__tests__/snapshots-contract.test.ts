import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { buildSnapshot } from '../../testing-utils';
import { buildSnapshot as engineBuildSnapshot } from '../api/countdown-engine';
import { clampSeconds } from '../time/clamp';
import { TimerState } from '../state/state-machine';

/**
 * Adapter-contract property for testing-utils/snapshots.ts (item 2 refactor).
 *
 * `buildSnapshot` was rewritten as a thin ADAPTER: it owns ONLY the ergonomic option-bag
 * resolution (the initial/total cross-fallback chains and the default-state heuristic) and
 * DELEGATES every snapshot invariant (clamp, decompose -> parts, isRunning, isCompleted) to
 * the engine's canonical buildSnapshot — the single source of truth. This property machine-
 * checks that delegation: for ANY option bag, the adapter's output must deep-equal the engine
 * building from the resolved (initial, total, state) triple. Re-implementing any invariant
 * inside snapshots.ts (drift from production) would break this equality.
 */
describe('snapshots.ts adapter contract — single source of truth (property)', () => {
  const secondsArb = fc.oneof(
    fc.integer({ min: -10, max: 40 * 365 * 24 * 3600 }),
    fc.double(),
    fc.constantFrom(
      0,
      -0,
      -1,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.MAX_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER + 1,
      10.5,
      45,
      90
    )
  );
  const stateArb = fc.constantFrom(TimerState.IDLE, TimerState.RUNNING, TimerState.PAUSED, TimerState.STOPPED);

  it('buildSnapshot(opts) deep-equals engine buildSnapshot(resolved initial/total/state) for ANY options', () => {
    fc.assert(
      fc.property(
        fc.record({
          initialSeconds: fc.option(secondsArb, { nil: undefined }),
          totalSeconds: fc.option(secondsArb, { nil: undefined }),
          state: fc.option(stateArb, { nil: undefined }),
        }),
        opts => {
          // Re-derive ONLY the adapter's ergonomic resolution (fallback chains + state
          // heuristic). Every invariant (clamp, decompose -> parts, isRunning/isCompleted)
          // must come from the engine, so this expectation can never drift from production.
          const resolvedInitial = opts.initialSeconds ?? opts.totalSeconds ?? 0;
          const resolvedTotal = opts.totalSeconds ?? opts.initialSeconds ?? 0;
          const resolvedState = opts.state ?? (clampSeconds(resolvedTotal) > 0 ? TimerState.IDLE : TimerState.STOPPED);
          expect(buildSnapshot(opts)).toEqual(engineBuildSnapshot(resolvedInitial, resolvedTotal, resolvedState));
        }
      ),
      { numRuns: 1000 }
    );
  });
});
