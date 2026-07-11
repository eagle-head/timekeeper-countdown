import { buildSnapshot as buildEngineSnapshot } from '../src/api/countdown-engine';
import type { CountdownSnapshot } from '../src/model/countdown-snapshot';
import { clampSeconds } from '../src/time/clamp';
import { TimerState } from '../src/state/state-machine';

export interface SnapshotOptions {
  initialSeconds?: number;
  totalSeconds?: number;
  state?: TimerState;
}

export function buildSnapshot(options: SnapshotOptions = {}): CountdownSnapshot {
  // This helper owns ONLY the ergonomic option-bag defaults (the cross-fallback
  // chains and the default-state heuristic). Every snapshot invariant — the clamp
  // of the stored second-fields, decompose -> parts, and the isRunning/isCompleted
  // flags — is derived by the engine's canonical buildSnapshot, which is the single
  // source of truth. Delegating here (instead of re-implementing those rules) makes
  // it impossible for the test double to drift from production.
  const initialSeconds = options.initialSeconds ?? options.totalSeconds ?? 0;
  const totalSeconds = options.totalSeconds ?? options.initialSeconds ?? 0;
  // The default-state heuristic gates on the CLAMPED total (clampSeconds is itself the
  // shared single source of truth for clamping); the engine re-clamps idempotently.
  const state = options.state ?? (clampSeconds(totalSeconds) > 0 ? TimerState.IDLE : TimerState.STOPPED);
  return buildEngineSnapshot(initialSeconds, totalSeconds, state);
}

export interface SequenceOptions extends SnapshotOptions {
  step?: number;
  count?: number;
}

export function buildSnapshotSequence(options: SequenceOptions = {}): CountdownSnapshot[] {
  const { totalSeconds = 0, step = 1, count = 1, initialSeconds } = options;
  const safeTotal = clampSeconds(totalSeconds);
  const safeStep = clampSeconds(step);
  const safeCount = clampSeconds(count) || 1;
  const snapshots: CountdownSnapshot[] = [];

  for (let index = 0; index < safeCount; index += 1) {
    const remaining = Math.max(safeTotal - safeStep * index, 0);
    snapshots.push(
      buildSnapshot({
        initialSeconds: initialSeconds ?? safeTotal,
        totalSeconds: remaining,
        state: remaining === 0 ? TimerState.STOPPED : TimerState.RUNNING,
      })
    );
  }

  return snapshots;
}

export { TimerState };
